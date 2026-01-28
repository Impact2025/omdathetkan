import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { toast } from '../stores/toastStore';
import { useMessages } from '../hooks/useMessages';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { PartnerStatus } from '../components/features/PartnerStatus';
import { FloatingHearts } from '../components/ui/FloatingHearts';
import * as api from '../lib/api';
import type { MessageType } from '@pureliefde/shared';

export default function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [heartTrigger, setHeartTrigger] = useState(0);
  const [coupleError, setCoupleError] = useState<string | null>(null);
  const [isCoupleLoading, setIsCoupleLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { partner, isPartnerTyping, isPartnerOnline, setPartner, addMessage } = useChatStore();

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    reactToMessage,
    markAsRead,
  } = useMessages();

  const [coupleId, setCoupleId] = useState<string | null>(null);

  const { sendTypingStart, sendTypingStop, isConnected } = useWebSocket({
    coupleId,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
  });

  // Load couple info
  useEffect(() => {
    const loadCouple = async () => {
      setIsCoupleLoading(true);
      setCoupleError(null);
      try {
        const response = await api.getCouple();
        if (response.couple) {
          setCoupleId(response.couple.id);
          if (response.couple.partner) {
            setPartner({
              id: response.couple.partner.id,
              name: response.couple.partner.name,
              avatarUrl: response.couple.partner.avatarUrl,
              lastSeen: new Date(response.couple.partner.lastSeen),
            });
          }
        } else {
          // No couple yet, redirect to invite page
          navigate('/invite');
        }
      } catch (error) {
        console.error('Failed to load couple:', error);
        setCoupleError(error instanceof Error ? error.message : 'Kon koppel niet laden');
      } finally {
        setIsCoupleLoading(false);
      }
    };

    loadCouple();
  }, [navigate, setPartner]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they become visible
  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== user?.id && !msg.readAt
    );

    unreadMessages.forEach((msg) => {
      markAsRead(msg.id);
    });
  }, [messages, user?.id, markAsRead]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      const scrollHeight = container.scrollHeight;
      loadMoreMessages()
        .then(() => {
          // Maintain scroll position after loading
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollHeight;
        })
        .catch(() => {
          // Error already handled in useMessages hook
        });
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  const handleSend = async (content: string, type: MessageType, mediaUrl?: string) => {
    try {
      await sendMessage({ content, messageType: type, mediaUrl });

      // Trigger floating hearts for love-related messages
      if (type === 'emoji' || content.includes('love') || content.includes('liefde')) {
        setHeartTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Kon bericht niet versturen. Probeer het opnieuw.');
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await reactToMessage(messageId, emoji);
    setHeartTrigger((prev) => prev + 1);
  };

  // Show error state if couple loading failed
  if (coupleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Kon chat niet laden
          </h1>
          <p className="text-gray-600 mb-6">{coupleError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!coupleId || isCoupleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-4xl"
        >
          💕
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <FloatingHearts trigger={heartTrigger} />

      {/* Header */}
      <header className="glass border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <PartnerStatus
            name={partner?.name || 'Partner'}
            avatarUrl={partner?.avatarUrl}
            isOnline={isPartnerOnline}
            isTyping={isPartnerTyping}
            lastSeen={partner?.lastSeen}
            onClick={() => navigate('/settings')}
          />

          <div className="flex items-center gap-2">
            {!isConnected && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                Verbinden...
              </span>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingMore && (
          <div className="text-center py-2">
            <span className="text-gray-400 text-sm">Oudere berichten laden...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-4xl"
            >
              💕
            </motion.div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-6xl mb-4">💌</span>
            <p className="text-gray-500">
              Nog geen berichten.<br />
              Stuur je eerste liefdesbericht!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showAvatar =
              !prevMessage ||
              prevMessage.senderId !== message.senderId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                5 * 60 * 1000;

            return (
              <div key={message.id} className="group">
                <MessageBubble
                  message={message}
                  showAvatar={showAvatar}
                  onReact={(emoji) => handleReact(message.id, emoji)}
                />
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-gray-500"
          >
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
            </div>
            <span className="text-sm">{partner?.name} is aan het typen...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="safe-bottom">
        <MessageInput
          onSend={handleSend}
          onTypingStart={sendTypingStart}
          onTypingStop={sendTypingStop}
        />
      </div>
    </div>
  );
}
