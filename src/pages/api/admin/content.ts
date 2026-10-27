import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db/client';
import { pageContent } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { getPageContent } from '@/lib/content';

export const GET: APIRoute = async ({ url }) => {
  const page = url.searchParams.get('page') || 'home';
  const data = await getPageContent(page);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const session = await validateSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const db = getDb();
  if (!db) return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });

  try {
    const body = await request.json();
    const { pageSlug, sectionKey, content } = body;

    if (!pageSlug || !sectionKey || content === undefined) {
      return new Response(JSON.stringify({ error: 'pageSlug, sectionKey, content required' }), { status: 400 });
    }

    await db
      .insert(pageContent)
      .values({ pageSlug, sectionKey, content })
      .onConflictDoUpdate({
        target: [pageContent.pageSlug, pageContent.sectionKey],
        set: { content, updatedAt: new Date() },
      });

    await logAuditEvent('PAGE_CONTENT_UPDATED', ip, session.user.username, { pageSlug, sectionKey });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Content update error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Update failed' }), { status: 500 });
  }
};
