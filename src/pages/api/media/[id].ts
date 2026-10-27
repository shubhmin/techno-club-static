import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { mediaAssets } from '@/lib/db/schema';

export const GET: APIRoute = async ({ params }) => {
  const idStr = params.id;
  const id = parseInt(idStr || '', 10);
  if (isNaN(id)) {
    return new Response('Invalid media ID', { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return new Response('Database offline', { status: 503 });
  }

  try {
    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    if (!asset) {
      return new Response('Asset not found', { status: 404 });
    }

    // Strip data URI prefix if present (e.g. "data:image/webp;base64,...")
    const base64Data = asset.data.includes(',')
      ? asset.data.split(',')[1]
      : asset.data;

    const buffer = Buffer.from(base64Data, 'base64');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Media fetch error:', err);
    return new Response('Server error', { status: 500 });
  }
};
