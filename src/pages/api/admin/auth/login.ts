import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { adminUsers } from '@/lib/db/schema';
import {
  verifyPassword,
  createSession,
  isRateLimited,
  recordLoginAttempt,
  logAuditEvent,
} from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Rate-limiting check
    const rateCheck = await isRateLimited(ip, username);
    if (rateCheck.blocked) {
      await logAuditEvent('LOGIN_LOCKED_OUT', ip, username, { remainingSec: rateCheck.remainingSec });
      return new Response(
        JSON.stringify({
          error: `Too many failed attempts. Console locked. Please wait ${rateCheck.remainingSec}s.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDb();
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database offline or DATABASE_URL not set' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch admin
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    if (!user) {
      await recordLoginAttempt(ip, username, false);
      await logAuditEvent('LOGIN_FAILED_UNKNOWN_USER', ip, username);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Constant-time password verification
    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      await recordLoginAttempt(ip, username, false);
      await logAuditEvent('LOGIN_FAILED_PASSWORD_MISMATCH', ip, username);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Success -> Record attempt, audit log, generate session
    await recordLoginAttempt(ip, username, true);
    await logAuditEvent('LOGIN_SUCCESS', ip, username);

    const userAgent = request.headers.get('user-agent') || undefined;
    await createSession(user.id, cookies, ip, userAgent);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Authentication internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
