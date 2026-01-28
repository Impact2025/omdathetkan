import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import type { WSMessage, WSNewMessage, WSReadReceipt, WSTypingIndicator, WSPresence, WSReaction } from '@pureliefde/shared';

interface UseWebSocketOptions {
  coupleId: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Exponential backoff configuration
const BACKOFF_CONFIG = {
  initialDelay: 1000,    // 1 second
  maxDelay: 30000,       // 30 seconds
  multiplier: 2,
};

export function useWebSocket({ coupleId, onConnect, onDisconnect }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectDelayRef = useRef(BACKOFF_CONFIG.initialDelay);
  const [isConnected, setIsConnected] = useState(false);

  const { user, token } = useAuthStore();
  const { addMessage, markMessageRead, setPartnerTyping, setPartnerOnline, addReaction } = useChatStore();

  const connect = useCallback(() => {
    if (!coupleId || !user || !token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${coupleId}?userId=${user.id}&token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Reset backoff delay on successful connection
      reconnectDelayRef.current = BACKOFF_CONFIG.initialDelay;
      onConnect?.();
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnect?.();

      // Exponential backoff for reconnection
      const delay = reconnectDelayRef.current;
      console.log(`WebSocket reconnecting in ${delay / 1000}s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);

      // Increase delay for next reconnection attempt (with max cap)
      reconnectDelayRef.current = Math.min(
        delay * BACKOFF_CONFIG.multiplier,
        BACKOFF_CONFIG.maxDelay
      );
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        handleMessage(message);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };
  }, [coupleId, user, token, onConnect, onDisconnect]);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'message:new': {
        const { message: newMessage } = message.payload as WSNewMessage;
        // Don't add if it's from the current user (already added optimistically)
        if (newMessage.senderId !== user?.id) {
          addMessage(newMessage);
        }
        break;
      }

      case 'message:read': {
        const { messageId } = message.payload as WSReadReceipt;
        markMessageRead(messageId);
        break;
      }

      case 'message:reaction': {
        const { messageId, reaction } = message.payload as WSReaction;
        if (reaction.userId !== user?.id) {
          addReaction(messageId, reaction);
        }
        break;
      }

      case 'typing:start': {
        const { userId } = message.payload as WSTypingIndicator;
        if (userId !== user?.id) {
          setPartnerTyping(true);
        }
        break;
      }

      case 'typing:stop': {
        const { userId } = message.payload as WSTypingIndicator;
        if (userId !== user?.id) {
          setPartnerTyping(false);
        }
        break;
      }

      case 'presence:online': {
        const { userId } = message.payload as WSPresence;
        if (userId !== user?.id) {
          setPartnerOnline(true);
        }
        break;
      }

      case 'presence:offline': {
        const { userId } = message.payload as WSPresence;
        if (userId !== user?.id) {
          setPartnerOnline(false);
        }
        break;
      }
    }
  }, [user?.id, addMessage, markMessageRead, setPartnerTyping, setPartnerOnline, addReaction]);

  const sendTypingStart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && coupleId) {
      wsRef.current.send(JSON.stringify({
        type: 'typing:start',
        payload: { coupleId },
        timestamp: Date.now(),
      }));
    }
  }, [coupleId]);

  const sendTypingStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && coupleId) {
      wsRef.current.send(JSON.stringify({
        type: 'typing:stop',
        payload: { coupleId },
        timestamp: Date.now(),
      }));
    }
  }, [coupleId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    // Reset backoff delay when manually disconnecting
    reconnectDelayRef.current = BACKOFF_CONFIG.initialDelay;
  }, []);

  useEffect(() => {
    if (coupleId && user && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [coupleId, user, token, connect, disconnect]);

  return {
    isConnected,
    sendTypingStart,
    sendTypingStop,
    disconnect,
    reconnect: connect,
  };
}
