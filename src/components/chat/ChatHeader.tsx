'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import type { User } from '@/db/schema';

interface ChatHeaderProps {
  partner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'lastSeen'>;
  isOnline: boolean;
  anniversaryDate: string | null;
}

export function ChatHeader({ partner, isOnline, anniversaryDate }: ChatHeaderProps) {
  const daysTogether = anniversaryDate
    ? differenceInDays(new Date(), new Date(anniversaryDate))
    : null;

  return (
    <header className="glass border-b border-white/20 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold">
            {partner.avatarUrl ? (
              <img
                src={partner.avatarUrl}
                alt={partner.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              partner.name[0].toUpperCase()
            )}
          </div>
          {/* Online indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Name and status */}
        <div>
          <h1 className="font-semibold text-gray-800">{partner.name}</h1>
          <p className="text-xs text-gray-500">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Days counter */}
        {daysTogether !== null && daysTogether > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
          >
            <span>💕</span>
            <span className="font-medium">{daysTogether}</span>
            <span className="text-xs">dagen</span>
          </motion.div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
