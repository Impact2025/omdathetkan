import { useState, useEffect, useCallback } from 'react';
import type { SendMessageRequest } from '@pureliefde/shared';

interface QueuedMessage extends SendMessageRequest {
  id: string;
  timestamp: number;
}

const QUEUE_KEY = 'pureliefde-offline-queue';

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load queue from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      if (saved) {
        setQueue(JSON.parse(saved));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback((message: SendMessageRequest) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setQueue((prev) => [...prev, queuedMessage]);
    return queuedMessage.id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const processQueue = useCallback(
    async (sendFn: (message: SendMessageRequest) => Promise<void>) => {
      if (!isOnline || queue.length === 0) return;

      const messagesToSend = [...queue];

      for (const message of messagesToSend) {
        try {
          await sendFn({
            content: message.content,
            messageType: message.messageType,
            mediaUrl: message.mediaUrl,
          });
          removeFromQueue(message.id);
        } catch (error) {
          console.error('Failed to send queued message:', error);
          // Stop processing on error
          break;
        }
      }
    },
    [isOnline, queue, removeFromQueue]
  );

  return {
    queue,
    isOnline,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    hasQueuedMessages: queue.length > 0,
  };
}
