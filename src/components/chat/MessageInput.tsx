'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '@/actions/upload';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'emoji') => void;
  onSendMedia: (mediaUrl: string, type: 'image' | 'video' | 'voice') => void;
  onTyping: () => void;
}

const QUICK_EMOJIS = ['❤️', '😘', '🥰', '😍', '💕', '💋', '🤗', '😊'];

export function MessageInput({ onSendMessage, onSendMedia, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Check if it's just a single emoji
    const trimmed = message.trim();
    const isEmoji = trimmed.length <= 2 && /[\u{1F300}-\u{1FAD6}]/u.test(trimmed);
    onSendMessage(message.trim(), isEmoji ? 'emoji' : 'text');
    setMessage('');
    setShowEmojis(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Debounced typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFile(formData);
      onSendMedia(result.url, result.type as 'image' | 'video' | 'voice');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload mislukt');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji, 'emoji');
    setShowEmojis(false);
  };

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-lg p-4">
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex gap-2 justify-center flex-wrap"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Input */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Typ een bericht..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
