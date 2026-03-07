'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPusherClient, EVENTS, getCoupleChannel } from '@/lib/pusher';
import { sendMessage, markAsRead, sendTypingIndicator } from '@/actions/messages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { usePresence } from '@/hooks/usePresence';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import type { User, Message, Reaction } from '@/db/schema';

const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  reactions: Reaction[];
}

interface CoupleWithPartner {
  id: string;
  anniversaryDate: string | null;
  partner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'lastSeen'>;
}

interface ChatClientProps {
  initialMessages: MessageWithSender[];
  currentUser: User;
  couple: CoupleWithPartner;
}

export function ChatClient({ initialMessages, currentUser, couple }: ChatClientProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Determine initial online status based on lastSeen
  const getInitialOnlineStatus = () => {
    if (!couple.partner.lastSeen) return false;
    const lastSeenTime = new Date(couple.partner.lastSeen).getTime();
    return Date.now() - lastSeenTime < ONLINE_THRESHOLD;
  };

  const [isPartnerOnline, setIsPartnerOnline] = useState(getInitialOnlineStatus);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Use presence hook to send heartbeats
  usePresence({ coupleId: couple.id, userId: currentUser.id });

  // Auto-logout for Vincent after 60 seconds of inactivity
  useAutoLogout({
    timeoutSeconds: 60,
    enabled: currentUser.email === 'vincent@pureliefde.nl',
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to Pusher events
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      // Pusher not configured - realtime features disabled
      return;
    }

    const channel = pusher.subscribe(getCoupleChannel(couple.id));

    channel.bind(EVENTS.MESSAGE_NEW, (data: { message: MessageWithSender }) => {
      if (data.message.senderId !== currentUser.id) {
        setMessages((prev) => [...prev, data.message]);
        markAsRead(data.message.id);
      }
    });

    channel.bind(EVENTS.MESSAGE_READ, (data: { messageId: string; readAt: Date }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, readAt: data.readAt } : m))
      );
    });

    channel.bind(EVENTS.MESSAGE_REACTION, (data: { messageId: string; reaction: Reaction }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, reactions: [...m.reactions, data.reaction] }
            : m
        )
      );
    });

    channel.bind(EVENTS.TYPING_START, (data: { userId: string }) => {
      if (data.userId !== currentUser.id) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
      }
    });

    channel.bind(EVENTS.TYPING_STOP, (data: { userId: string }) => {
      if (data.userId !== currentUser.id) {
        setIsPartnerTyping(false);
      }
    });

    channel.bind(EVENTS.PRESENCE_UPDATE, (data: { userId: string; isOnline: boolean }) => {
      if (data.userId !== currentUser.id) {
        setIsPartnerOnline(data.isOnline);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getCoupleChannel(couple.id));
    };
  }, [couple.id, currentUser.id]);

  const handleSendMessage = async (content: string, type: 'text' | 'emoji' = 'text') => {
    try {
      const newMessage = await sendMessage({ content, messageType: type });
      setMessages((prev) => [...prev, newMessage]);
      sendTypingIndicator(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendMedia = async (mediaUrl: string, type: 'image' | 'video' | 'voice' | 'youtube' | 'spotify') => {
    try {
      const newMessage = await sendMessage({ mediaUrl, messageType: type });
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send media:', error);
    }
  };

  const handleSendSticker = async (emoji: string) => {
    try {
      const newMessage = await sendMessage({ content: emoji, messageType: 'sticker' });
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send sticker:', error);
    }
  };

  const handleTyping = () => {
    sendTypingIndicator(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <ChatHeader
        partner={couple.partner}
        isOnline={isPartnerOnline}
        anniversaryDate={couple.anniversaryDate}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.senderId === currentUser.id}
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-gray-500 text-sm"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{couple.partner.name} is aan het typen...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        onSendSticker={handleSendSticker}
        onTyping={handleTyping}
      />
    </div>
  );
}
