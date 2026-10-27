import type { APIRoute } from 'astro';
import { getObjectFromS3 } from '@/lib/s3';

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) {
    return new Response('Invalid key', { status: 400 });
  }

  try {
    const s3Obj = await getObjectFromS3(key);
    if (!s3Obj) {
      return new Response('Asset not found in S3', { status: 404 });
    }

    return new Response(s3Obj.buffer, {
      status: 200,
      headers: {
        'Content-Type': s3Obj.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': s3Obj.buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('S3 key fetch error:', err);
    return new Response('Server error', { status: 500 });
  }
};
