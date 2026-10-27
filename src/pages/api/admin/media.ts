import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db/client';
import { mediaAssets } from '@/lib/db/schema';
import { validateSession, logAuditEvent } from '@/lib/auth';
import { isS3Configured, uploadToS3 } from '@/lib/s3';

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
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let filename = 'uploaded-image.webp';
    let mimeType = 'image/webp';
    let buffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file attached' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      filename = file.name || filename;
      mimeType = file.type || mimeType;

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const json = await request.json();
      filename = json.filename || filename;
      mimeType = json.mimeType || mimeType;
      if (json.data) {
        const raw = json.data.includes(',') ? json.data.split(',')[1] : json.data;
        buffer = Buffer.from(raw, 'base64');
      }
    }

    if (!buffer || buffer.length === 0) {
      return new Response(JSON.stringify({ error: 'File data is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let publicUrl = '';
    let s3Key: string | null = null;
    let s3Url: string | null = null;
    let base64Fallback: string | null = null;

    // Check if S3 is configured
    if (isS3Configured()) {
      try {
        const s3Res = await uploadToS3(buffer, filename, mimeType);
        s3Key = s3Res.key;
        s3Url = s3Res.url;
        publicUrl = s3Res.url;
      } catch (s3Err: any) {
        console.error('S3 upload encountered error, falling back to database storage:', s3Err);
        base64Fallback = buffer.toString('base64');
      }
    } else {
      base64Fallback = buffer.toString('base64');
    }

    // Save record in database
    const [saved] = await db
      .insert(mediaAssets)
      .values({
        filename,
        mimeType,
        data: base64Fallback,
        s3Key,
        s3Url,
      })
      .returning();

    // If S3 wasn't used or URL wasn't assigned, use our proxy endpoint
    if (!publicUrl) {
      publicUrl = `/api/media/${saved.id}`;
    }

    await logAuditEvent('MEDIA_UPLOADED', ip, session.user.username, {
      id: saved.id,
      filename,
      storage: s3Key ? 's3' : 'database',
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: saved.id,
        url: publicUrl,
        filename: saved.filename,
        storage: s3Key ? 's3' : 'database',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Media upload error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
