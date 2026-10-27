import crypto from 'node:crypto';
import { eq, and, gt, desc } from 'drizzle-orm';
import { getDb, ensureDatabaseBootstrapped } from './db/client';
import { adminUsers, sessions, loginAttempts, securityAuditLogs } from './db/schema';
import type { AstroCookies } from 'astro';

const SESSION_COOKIE_NAME = 'ts_admin_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8 hours hard lifetime
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

// Password hashing with Scrypt (memory-hard, resistant to GPU/ASIC attacks)
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

// Constant-time password comparison against timing attacks
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    const storedBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

// Generate high-entropy 256-bit random session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Audit logging helper
export async function logAuditEvent(
  eventType: string,
  ipAddress: string,
  actorUsername?: string,
  details?: Record<string, any> | string
) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(securityAuditLogs).values({
      eventType,
      ipAddress: ipAddress || 'unknown',
      actorUsername: actorUsername || null,
      details: typeof details === 'object' ? JSON.stringify(details) : details || null,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// Brute force check: count failed attempts in the lockout window
export async function isRateLimited(ipAddress: string, username?: string): Promise<{ blocked: boolean; remainingSec: number }> {
  const db = getDb();
  if (!db) return { blocked: false, remainingSec: 0 };

  try {
    const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);
    const recent = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipAddress, ipAddress),
          eq(loginAttempts.success, false),
          gt(loginAttempts.attemptedAt, cutoff)
        )
      )
      .orderBy(desc(loginAttempts.attemptedAt));

    if (recent.length >= MAX_FAILED_ATTEMPTS) {
      const oldestAttempt = recent[recent.length - 1].attemptedAt;
      const elapsedMs = Date.now() - oldestAttempt.getTime();
      const remainingSec = Math.max(0, Math.ceil((LOCKOUT_WINDOW_MINUTES * 60 * 1000 - elapsedMs) / 1000));
      return { blocked: true, remainingSec };
    }
  } catch (err) {
    console.error('Rate limit check error:', err);
  }

  return { blocked: false, remainingSec: 0 };
}

// Record login attempt
export async function recordLoginAttempt(ipAddress: string, username: string, success: boolean) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(loginAttempts).values({
      ipAddress,
      username,
      success,
    });
  } catch (err) {
    console.error('Failed to record login attempt:', err);
  }
}

// Check if any admin exists
export async function hasAdminUser(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await ensureDatabaseBootstrapped();
    const users = await db.select().from(adminUsers).limit(1);
    return users.length > 0;
  } catch {
    return false;
  }
}

// Create initial admin user (wizard)
export async function createAdminUser(username: string, password: string, ipAddress: string) {
  const db = getDb();
  if (!db) throw new Error('Database connection not configured');

  await ensureDatabaseBootstrapped();
  const existing = await hasAdminUser();
  if (existing) {
    throw new Error('Admin user already configured');
  }

  const { hash, salt } = hashPassword(password);
  const [created] = await db
    .insert(adminUsers)
    .values({
      username: username.trim(),
      passwordHash: hash,
      salt,
    })
    .returning();

  await logAuditEvent('INITIAL_ADMIN_CREATED', ipAddress, username, 'Admin account setup via wizard');
  return created;
}

// Session validation
export async function validateSession(cookies: AstroCookies): Promise<{ user: { id: number; username: string } } | null> {
  const db = getDb();
  if (!db) return null;

  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    await ensureDatabaseBootstrapped();
    const [session] = await db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: adminUsers.id,
        username: adminUsers.username,
      })
      .from(sessions)
      .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
      .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (!session) {
      cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      return null;
    }

    return {
      user: {
        id: session.userId,
        username: session.username,
      },
    };
  } catch (err) {
    console.error('Session validation error:', err);
    return null;
  }
}

// Create session on successful login
export async function createSession(userId: number, cookies: AstroCookies, ipAddress?: string, userAgent?: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Database not connected');

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });

  return token;
}

// Destroy session on logout
export async function destroySession(cookies: AstroCookies) {
  const db = getDb();
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (db && token) {
    try {
      await db.delete(sessions).where(eq(sessions.id, token));
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
