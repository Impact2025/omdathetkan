'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from '../chat/MessageBubble';
import Link from 'next/link';
import type { User, Message, Reaction } from '@/db/schema';

interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  reactions: Reaction[];
}

interface CoupleWithPartner {
  id: string;
  anniversaryDate: string | null;
  partner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'lastSeen'>;
}

interface ArchiveClientProps {
  initialMessages: MessageWithSender[];
  currentUser: User;
  couple: CoupleWithPartner;
}

export function ArchiveClient({ initialMessages, currentUser, couple }: ArchiveClientProps) {
  const [messages] = useState<MessageWithSender[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">Archief</h1>
            <p className="text-xs text-gray-500">{messages.length} gearchiveerde berichten</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="font-medium">Geen gearchiveerde berichten</p>
              <p className="text-sm mt-1">Berichten worden automatisch gearchiveerd</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === currentUser.id}
              />
            ))}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
