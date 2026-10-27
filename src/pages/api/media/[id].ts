import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { mediaAssets } from '@/lib/db/schema';
import { getObjectFromS3 } from '@/lib/s3';

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

    // 1. If stored in S3, fetch object from S3
    if (asset.s3Key) {
      const s3Obj = await getObjectFromS3(asset.s3Key);
      if (s3Obj) {
        return new Response(s3Obj.buffer, {
          status: 200,
          headers: {
            'Content-Type': s3Obj.contentType || asset.mimeType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': s3Obj.buffer.length.toString(),
          },
        });
      }
      // If direct s3Url is present and s3 fetch failed, redirect
      if (asset.s3Url) {
        return Response.redirect(asset.s3Url, 302);
      }
    }

    // 2. Fallback to base64 stored data in DB
    if (asset.data) {
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
    }

    return new Response('Asset media empty', { status: 404 });
  } catch (err) {
    console.error('Media fetch error:', err);
    return new Response('Server error', { status: 500 });
  }
};
