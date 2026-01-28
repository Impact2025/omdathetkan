import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import type { UploadUrlRequest } from '@pureliefde/shared';
import { LIMITS } from '@pureliefde/shared';

const mediaRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// Only POST routes require authentication (uploads)
// GET routes are public so images can be loaded in <img> tags
mediaRoute.use('/upload-url', authMiddleware);
mediaRoute.use('/upload/*', authMiddleware);

// Allowed content types
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'],
};

// Get upload URL for direct upload to R2
mediaRoute.post('/upload-url', async (c) => {
  const userId = c.get('userId');
  const { filename, contentType } = await c.req.json<UploadUrlRequest>();

  if (!filename || !contentType) {
    throw new HTTPException(400, { message: 'Filename and content type are required' });
  }

  // Validate content type
  const isImage = ALLOWED_TYPES.image.includes(contentType);
  const isVideo = ALLOWED_TYPES.video.includes(contentType);
  const isAudio = ALLOWED_TYPES.audio.includes(contentType);

  if (!isImage && !isVideo && !isAudio) {
    throw new HTTPException(400, { message: 'Invalid file type' });
  }

  // Generate unique key
  const ext = filename.split('.').pop() || 'bin';
  const key = `${userId}/${nanoid()}/${Date.now()}.${ext}`;

  // For R2, we'll upload directly from the client using a presigned URL
  // Since Cloudflare R2 doesn't support presigned URLs the same way S3 does,
  // we'll use a different approach: the client uploads to our API, which then uploads to R2

  // Use API proxy URL if R2_PUBLIC_URL is not configured (local dev)
  const publicUrl = c.env.R2_PUBLIC_URL
    ? `${c.env.R2_PUBLIC_URL}/${key}`
    : `/api/media/${key}`;

  return c.json({
    uploadUrl: `/api/media/upload/${key}`,
    publicUrl,
    key,
  });
});

// Direct upload to R2 (proxied through worker)
mediaRoute.post('/upload/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const contentType = c.req.header('Content-Type');

  if (!contentType) {
    throw new HTTPException(400, { message: 'Content-Type header is required' });
  }

  // Validate content type
  const isImage = ALLOWED_TYPES.image.includes(contentType);
  const isVideo = ALLOWED_TYPES.video.includes(contentType);
  const isAudio = ALLOWED_TYPES.audio.includes(contentType);

  if (!isImage && !isVideo && !isAudio) {
    throw new HTTPException(400, { message: 'Invalid file type' });
  }

  // Check file size based on type
  const contentLength = parseInt(c.req.header('Content-Length') || '0');

  if (isImage && contentLength > LIMITS.IMAGE_MAX_SIZE) {
    throw new HTTPException(400, { message: `Image too large (max ${LIMITS.IMAGE_MAX_SIZE / 1024 / 1024}MB)` });
  }

  if (isVideo && contentLength > LIMITS.VIDEO_MAX_SIZE) {
    throw new HTTPException(400, { message: `Video too large (max ${LIMITS.VIDEO_MAX_SIZE / 1024 / 1024}MB)` });
  }

  // Get request body as array buffer
  const body = await c.req.arrayBuffer();

  // Upload to R2 with error handling
  try {
    await c.env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: {
        contentType,
      },
    });
  } catch (err) {
    console.error('R2 upload failed:', err);
    throw new HTTPException(500, { message: 'Failed to upload file. Please try again.' });
  }

  // Use API proxy URL if R2_PUBLIC_URL is not configured (local dev)
  const publicUrl = c.env.R2_PUBLIC_URL
    ? `${c.env.R2_PUBLIC_URL}/${key}`
    : `/api/media/${key}`;

  return c.json({
    success: true,
    url: publicUrl,
  });
});

// Get media (proxy from R2)
mediaRoute.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');

  const object = await c.env.MEDIA_BUCKET.get(key);

  if (!object) {
    throw new HTTPException(404, { message: 'Media not found' });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  headers.set('ETag', object.etag);

  return new Response(object.body, {
    headers,
  });
});

export default mediaRoute;
