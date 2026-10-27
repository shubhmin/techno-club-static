import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { getProjects } from '@/lib/content';

export const GET: APIRoute = async () => {
  const data = await getProjects();
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
      categoryTag: body.categoryTag || 'WEB APP',
      track: body.track || 'ALL GRADES',
      description: body.description,
      status: body.status || 'ACTIVE',
      linkUrl: body.linkUrl || null,
      sortOrder: parseInt(body.sortOrder || '0', 10),
      updatedAt: new Date(),
    };

    if (!payload.title || !payload.description) {
      return new Response(JSON.stringify({ error: 'Title and description required' }), { status: 400 });
    }

    if (id) {
      await db.update(projects).set(payload).where(eq(projects.id, id));
      await logAuditEvent('PROJECT_UPDATED', ip, session.user.username, { id, title: payload.title });
    } else {
      await db.insert(projects).values(payload);
      await logAuditEvent('PROJECT_ADDED', ip, session.user.username, { title: payload.title });
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

    await db.delete(projects).where(eq(projects.id, id));
    await logAuditEvent('PROJECT_DELETED', ip, session.user.username, { id });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Delete failed' }), { status: 500 });
  }
};
