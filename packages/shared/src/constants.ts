// Love emojis for the picker
export const LOVE_EMOJIS = [
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
  '😍', '🥰', '😘', '😗', '😚', '😙', '🥲', '😊', '☺️', '😌',
  '💋', '💏', '💑', '👫', '👭', '👬', '🫂', '💐', '🌹', '🌷',
  '🦋', '✨', '💫', '⭐', '🌟', '🌙', '☀️', '🌈', '🔥', '💥',
];

// Sticker packs
export const STICKER_PACKS = {
  hearts: {
    name: 'Hearts',
    stickers: [
      'floating-heart',
      'beating-heart',
      'growing-heart',
      'sparkling-heart',
      'arrow-heart',
      'ribbon-heart',
    ],
  },
  kisses: {
    name: 'Kisses',
    stickers: [
      'kiss-mark',
      'blowing-kiss',
      'kissing-couple',
      'flying-kiss',
    ],
  },
  hugs: {
    name: 'Hugs',
    stickers: [
      'warm-hug',
      'bear-hug',
      'tight-hug',
      'group-hug',
    ],
  },
  cute: {
    name: 'Cute',
    stickers: [
      'blushing',
      'shy-smile',
      'happy-dance',
      'love-eyes',
      'starry-eyes',
    ],
  },
} as const;

// Milestones for date counter
export const MILESTONES = {
  days: [1, 7, 14, 30, 50, 100, 200, 365, 500, 1000],
  months: [1, 3, 6, 9, 12, 18, 24, 36, 48, 60],
  years: [1, 2, 3, 5, 10, 15, 20, 25, 50],
} as const;

// App theme colors
export const THEME_COLORS = {
  primary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    VERIFY: '/api/auth/verify',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  MESSAGES: {
    LIST: '/api/messages',
    SEND: '/api/messages',
    READ: (id: string) => `/api/messages/${id}/read`,
    REACT: (id: string) => `/api/messages/${id}/reactions`,
  },
  COUPLE: {
    GET: '/api/couple',
    UPDATE: '/api/couple',
    INVITE: '/api/couple/invite',
    ACCEPT: '/api/couple/accept',
  },
  MEDIA: {
    UPLOAD_URL: '/api/media/upload-url',
  },
} as const;

// WebSocket events
export const WS_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_REACTION: 'message:reaction',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  ERROR: 'error',
} as const;

// Limits
export const LIMITS = {
  MESSAGE_MAX_LENGTH: 2000,
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  VIDEO_MAX_DURATION: 30, // seconds
  VOICE_MAX_DURATION: 60, // seconds
  MESSAGES_PER_PAGE: 50,
} as const;
