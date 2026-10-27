import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { events } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { getEvents } from '@/lib/content';

export const GET: APIRoute = async () => {
  const data = await getEvents();
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
      title: body.title,
      track: body.track || 'WORKSHOP',
      status: body.status || 'UPCOMING',
      eventDate: body.eventDate,
      location: body.location,
      description: body.description,
      registrationLink: body.registrationLink || null,
      sortOrder: parseInt(body.sortOrder || '0', 10),
      updatedAt: new Date(),
    };

    if (id) {
      await db.update(events).set(payload).where(eq(events.id, id));
      await logAuditEvent('EVENT_UPDATED', ip, session.user.username, { id, title: body.title });
    } else {
      await db.insert(events).values(payload);
      await logAuditEvent('EVENT_CREATED', ip, session.user.username, { title: body.title });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('Events error:', err);
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

    await db.delete(events).where(eq(events.id, id));
    await logAuditEvent('EVENT_DELETED', ip, session.user.username, { id });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Delete failed' }), { status: 500 });
  }
};
