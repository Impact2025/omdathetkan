import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (lazy initialization)
let _pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (_pusherServer) return _pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn('Pusher credentials not configured - realtime features disabled');
    return null;
  }

  _pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return _pusherServer;
}

// Legacy export for backwards compatibility
export const pusherServer = null as unknown as Pusher;

// Client-side Pusher instance (singleton)
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('Pusher client credentials not configured');
    return null;
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(key, { cluster });
  }

  return pusherClient;
}

// Event types
export const EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_REACTION: 'message:reaction',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
} as const;

// Channel naming
export function getCoupleChannel(coupleId: string): string {
  return `private-couple-${coupleId}`;
}
