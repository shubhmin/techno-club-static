import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db/client';
import { siteSettings } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { getSiteSettings } from '@/lib/content';

export const GET: APIRoute = async () => {
  const data = await getSiteSettings();
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
    const updates: Record<string, string> = {
      accent_color: body.accentColor || 'blue',
      system_status: body.systemStatus || 'GUILD SYSTEMS: NORMAL · DAVPS SRESHTHA VIHAR',
      banner_active: String(Boolean(body.bannerActive)),
      banner_text: body.bannerText || '',
      banner_link: body.bannerLink || '',
    };

    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
    }

    await logAuditEvent('SETTINGS_UPDATED', ip, session.user.username, updates);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Update failed' }), { status: 500 });
  }
};
