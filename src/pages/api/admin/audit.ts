import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { securityAuditLogs } from '@/lib/db/schema';
import { validateSession } from '@/lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await validateSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database offline' }), { status: 503 });
  }

  try {
    const logs = await db
      .select()
      .from(securityAuditLogs)
      .orderBy(desc(securityAuditLogs.timestamp))
      .limit(100);

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Audit fetch failed' }), { status: 500 });
  }
};
