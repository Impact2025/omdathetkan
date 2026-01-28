'use client';

import { useEffect, useRef, useCallback } from 'react';
import { updatePresence } from '@/actions/messages';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface UsePresenceOptions {
  coupleId: string;
  userId: string;
}

export function usePresence({ coupleId, userId }: UsePresenceOptions) {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    try {
      await updatePresence();
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, []);

  const sendOffline = useCallback(() => {
    // Use beacon API for reliable offline detection
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const data = JSON.stringify({ userId, coupleId });
      navigator.sendBeacon('/api/presence/offline', data);
    }
  }, [userId, coupleId]);

  useEffect(() => {
    // Send initial presence
    sendHeartbeat();

    // Set up heartbeat interval
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      sendOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendOffline();
    };
  }, [sendHeartbeat, sendOffline]);
}
