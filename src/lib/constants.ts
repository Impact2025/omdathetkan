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

export const STICKERS = {
  liefde: [
    { id: 'love-1', emoji: '❤️', name: 'Rood hart' },
    { id: 'love-2', emoji: '💕', name: 'Twee hartjes' },
    { id: 'love-3', emoji: '💖', name: 'Sprankelend hart' },
    { id: 'love-4', emoji: '💗', name: 'Groeiend hart' },
    { id: 'love-5', emoji: '💓', name: 'Kloppend hart' },
    { id: 'love-6', emoji: '💘', name: 'Cupido hart' },
    { id: 'love-7', emoji: '💝', name: 'Hart met strik' },
    { id: 'love-8', emoji: '💋', name: 'Kus' },
  ],
  koppel: [
    { id: 'couple-1', emoji: '👫', name: 'Koppel' },
    { id: 'couple-2', emoji: '💑', name: 'Verliefd koppel' },
    { id: 'couple-3', emoji: '👩‍❤️‍👨', name: 'Hartjes koppel' },
    { id: 'couple-4', emoji: '💏', name: 'Kussend koppel' },
    { id: 'couple-5', emoji: '🤝', name: 'Handen vasthouden' },
    { id: 'couple-6', emoji: '🫂', name: 'Knuffel' },
    { id: 'couple-7', emoji: '👨‍👩‍👧', name: 'Familie' },
    { id: 'couple-8', emoji: '🏠', name: 'Thuis' },
  ],
  emoties: [
    { id: 'emotion-1', emoji: '😍', name: 'Verliefd' },
    { id: 'emotion-2', emoji: '🥰', name: 'Blij verliefd' },
    { id: 'emotion-3', emoji: '😘', name: 'Kus gezicht' },
    { id: 'emotion-4', emoji: '🤗', name: 'Knuffel' },
    { id: 'emotion-5', emoji: '😊', name: 'Blij' },
    { id: 'emotion-6', emoji: '🥺', name: 'Schattig' },
    { id: 'emotion-7', emoji: '😻', name: 'Verliefd katje' },
    { id: 'emotion-8', emoji: '🦋', name: 'Vlinders' },
  ],
} as const;

export type StickerCategory = keyof typeof STICKERS;
