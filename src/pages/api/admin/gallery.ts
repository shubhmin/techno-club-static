import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { galleryItems } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { getGallery } from '@/lib/content';

export const GET: APIRoute = async () => {
  const data = await getGallery();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const session = await validateSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const db = getDb();
  if (!db) return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });

  try {
    const body = await request.json();
    const id = body.id ? parseInt(body.id, 10) : null;

    const payload = {
      yearCategory: body.yearCategory || '2025–2026',
      albumTitle: body.albumTitle || 'Event Highlights',
      caption: body.caption || '',
      imageUrl: body.imageUrl,
      sortOrder: parseInt(body.sortOrder || '0', 10),
      updatedAt: new Date(),
    };

    if (!payload.imageUrl) {
      return new Response(JSON.stringify({ error: 'Image URL required' }), { status: 400 });
    }

    if (id) {
      await db.update(galleryItems).set(payload).where(eq(galleryItems.id, id));
      await logAuditEvent('GALLERY_UPDATED', ip, session.user.username, { id, caption: payload.caption });
    } else {
      await db.insert(galleryItems).values(payload);
      await logAuditEvent('GALLERY_ITEM_ADDED', ip, session.user.username, { caption: payload.caption });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Operation failed' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies, clientAddress }) => {
  const session = await validateSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const db = getDb();
  if (!db) return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });

  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '', 10);
    if (!id) return new Response(JSON.stringify({ error: 'Valid id required' }), { status: 400 });

    await db.delete(galleryItems).where(eq(galleryItems.id, id));
    await logAuditEvent('GALLERY_ITEM_DELETED', ip, session.user.username, { id });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Delete failed' }), { status: 500 });
  }
};
