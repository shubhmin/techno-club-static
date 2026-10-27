import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db/client';
import { mediaAssets } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const session = await validateSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const ip = clientAddress || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const db = getDb();
  if (!db) return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let filename = 'uploaded-image.webp';
    let mimeType = 'image/webp';
    let base64Data = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file attached' }), { status: 400 });
      }

      filename = file.name || filename;
      mimeType = file.type || mimeType;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString('base64');
    } else {
      const json = await request.json();
      filename = json.filename || filename;
      mimeType = json.mimeType || mimeType;
      base64Data = json.data;
    }

    if (!base64Data) {
      return new Response(JSON.stringify({ error: 'File data empty' }), { status: 400 });
    }

    const [saved] = await db
      .insert(mediaAssets)
      .values({
        filename,
        mimeType,
        data: base64Data,
      })
      .returning();

    const publicUrl = `/api/media/${saved.id}`;
    await logAuditEvent('MEDIA_UPLOADED', ip, session.user.username, { id: saved.id, filename });

    return new Response(
      JSON.stringify({
        success: true,
        id: saved.id,
        url: publicUrl,
        filename: saved.filename,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Media upload error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Upload failed' }), { status: 500 });
  }
};
