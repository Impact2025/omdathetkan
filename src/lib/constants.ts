export const LIMITS = {
  MESSAGE_MAX_LENGTH: 2000,
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50 MB
  VOICE_MAX_DURATION: 60, // seconds
  VIDEO_MAX_DURATION: 30, // seconds
  MESSAGES_PER_PAGE: 50,
} as const;

export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'],
} as const;
