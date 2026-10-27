import type { APIRoute } from 'astro';
import { validateSession, destroySession, logAuditEvent } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const session = await validateSession(cookies);

  if (session) {
    await logAuditEvent('LOGOUT', ip, session.user.username);
  }

  await destroySession(cookies);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
