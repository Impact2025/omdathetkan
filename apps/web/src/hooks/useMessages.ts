import { useEffect, useCallback, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { toast } from '../stores/toastStore';
import * as api from '../lib/api';
import type { SendMessageRequest } from '@pureliefde/shared';

export function useMessages() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const {
    messages,
    nextCursor,
    hasMoreMessages,
    setMessages,
    prependMessages,
    addMessage,
  } = useChatStore();

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getMessages();
      setMessages(response.messages);
      prependMessages([], response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [setMessages, prependMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !nextCursor) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await api.getMessages(nextCursor);
      prependMessages(response.messages, response.nextCursor);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kon oudere berichten niet laden';
      setLoadMoreError(errorMessage);
      toast.error('Kon oudere berichten niet laden');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, nextCursor, prependMessages]);

  const sendMessage = useCallback(async (data: SendMessageRequest) => {
    try {
      const response = await api.sendMessage(data);
      addMessage(response.message);
      return response.message;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to send message');
    }
  }, [addMessage]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await api.markMessageRead(messageId);
    } catch (err) {
      // Silent fail for read receipts - not critical to user experience
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      await api.addReaction(messageId, { emoji });
    } catch (err) {
      console.error('Failed to add reaction:', err);
      toast.error('Kon reactie niet toevoegen');
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    error,
    loadMoreError,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead,
    reactToMessage,
  };
}
