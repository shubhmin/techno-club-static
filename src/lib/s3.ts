import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function getBucket(): string {
  return process.env.S3_BUCKET || process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'techno-club';
}

export function isS3Configured(): boolean {
  return Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    process.env.S3_ENDPOINT ||
    process.env.AWS_ENDPOINT
  );
}

export function getS3Client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-2';

  const config: any = {
    forcePathStyle: true,
  };

  if (region) config.region = region;
  if (endpoint) config.endpoint = endpoint;
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  return new S3Client(config);
}

export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ key: string; url: string; bucket: string }> {
  const s3 = getS3Client();
  const bucket = getBucket();
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `uploads/${Date.now()}-${cleanName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // If a public CDN or base URL is provided, use it
  if (process.env.S3_PUBLIC_URL) {
    const base = process.env.S3_PUBLIC_URL.replace(/\/+$/, '');
    return { key, url: `${base}/${key}`, bucket };
  }

  // Generate a signed URL (default 7 days max presigned duration for S3)
  try {
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 604800 } // 7 days in seconds
    );
    return { key, url: signedUrl, bucket };
  } catch (err) {
    console.warn('Presigned URL generation failed, falling back to path:', err);
    return { key, url: `/api/media/s3/${encodeURIComponent(key)}`, bucket };
  }
}

export async function getObjectFromS3(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const s3 = getS3Client();
  const bucket = getBucket();
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) return null;
    const byteArray = await res.Body.transformToByteArray();
    return {
      buffer: Buffer.from(byteArray),
      contentType: res.ContentType || 'image/jpeg',
    };
  } catch (err) {
    console.error('Error fetching object from S3:', err);
    return null;
  }
}
