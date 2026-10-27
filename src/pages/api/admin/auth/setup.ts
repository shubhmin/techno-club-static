import type { APIRoute } from 'astro';
import { hasAdminUser, createAdminUser, createSession } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const alreadyConfigured = await hasAdminUser();
    if (alreadyConfigured) {
      return new Response(JSON.stringify({ error: 'Admin account already initialized.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username || username.length < 3) {
      return new Response(JSON.stringify({ error: 'Username must be at least 3 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Master password must be at least 8 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const admin = await createAdminUser(username, password, ip);
    const userAgent = request.headers.get('user-agent') || undefined;
    await createSession(admin.id, cookies, ip, userAgent);

    return new Response(JSON.stringify({ success: true, username: admin.username }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Setup error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Setup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
