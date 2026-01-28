'use server';

import { put } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';
import { LIMITS, ALLOWED_FILE_TYPES } from '@/lib/constants';

export async function uploadFile(formData: FormData) {
  // Check if Vercel Blob is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Foto uploads zijn nog niet geconfigureerd. Voeg BLOB_READ_WRITE_TOKEN toe aan je environment variables.');
  }

  const { user } = await requireAuth();

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('Geen bestand geselecteerd');
  }

  // Validate file type
  const isImage = (ALLOWED_FILE_TYPES.image as readonly string[]).includes(file.type);
  const isVideo = (ALLOWED_FILE_TYPES.video as readonly string[]).includes(file.type);
  const isAudio = (ALLOWED_FILE_TYPES.audio as readonly string[]).includes(file.type);

  if (!isImage && !isVideo && !isAudio) {
    throw new Error('Ongeldig bestandstype');
  }

  // Validate file size
  if (isImage && file.size > LIMITS.IMAGE_MAX_SIZE) {
    throw new Error(`Afbeelding te groot (max ${LIMITS.IMAGE_MAX_SIZE / 1024 / 1024}MB)`);
  }

  if (isVideo && file.size > LIMITS.VIDEO_MAX_SIZE) {
    throw new Error(`Video te groot (max ${LIMITS.VIDEO_MAX_SIZE / 1024 / 1024}MB)`);
  }

  // Upload to Vercel Blob
  const blob = await put(`${user.id}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return {
    url: blob.url,
    type: isImage ? 'image' : isVideo ? 'video' : 'audio',
  };
}
