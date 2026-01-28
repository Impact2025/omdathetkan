import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { MessageType } from '@pureliefde/shared';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { MediaUploader } from './MediaUploader';

interface MessageInputProps {
  onSend: (content: string, type: MessageType, mediaUrl?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Check if it's just emojis
    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    const type: MessageType = emojiRegex.test(trimmed) ? 'emoji' : 'text';

    onSend(trimmed, type);
    setMessage('');
    setIsTyping(false);
    onTypingStop();

    // Focus back on input
    inputRef.current?.focus();
  }, [message, onSend, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 2000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleStickerSelect = (stickerId: string) => {
    onSend(stickerId, 'sticker');
    setShowEmojiPicker(false);
  };

  const handleVoiceComplete = (audioUrl: string) => {
    onSend('', 'voice', audioUrl);
    setShowVoiceRecorder(false);
  };

  const handleMediaUpload = (mediaUrl: string, type: 'image' | 'video') => {
    onSend('', type, mediaUrl);
    setShowMediaUploader(false);
  };

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            setShowMediaUploader(true);
            setShowEmojiPicker(false);
            setShowVoiceRecorder(false);
            // Store file for MediaUploader to pick up via a custom event
            const event = new CustomEvent<File>('paste-image', { detail: file });
            window.dispatchEvent(event);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Emoji Picker Popup */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onStickerSelect={handleStickerSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recorder Popup */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <VoiceRecorder
              onComplete={handleVoiceComplete}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Uploader Popup */}
      <AnimatePresence>
        {showMediaUploader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 mb-2"
          >
            <MediaUploader
              onUpload={handleMediaUpload}
              onCancel={() => setShowMediaUploader(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div className="flex items-end gap-2 p-3 bg-white/90 backdrop-blur-lg border-t border-gray-100">
        {/* Action Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowVoiceRecorder(false);
              setShowMediaUploader(false);
            }}
            className={clsx(
              'p-2 rounded-full transition-colors',
              showEmojiPicker
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100'
            )}
            disabled={disabled}
          >
            <span className="text-xl">😊</span>
          </button>

          <button
            onClick={() => {
              setShowMediaUploader(!showMediaUploader);
              setShowVoiceRecorder(false);
              setShowEmojiPicker(false);
            }}
            className={clsx(
              'p-2 rounded-full transition-colors',
              showMediaUploader
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100'
            )}
            disabled={disabled}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => {
              setShowVoiceRecorder(!showVoiceRecorder);
              setShowEmojiPicker(false);
              setShowMediaUploader(false);
            }}
            className={clsx(
              'p-2 rounded-full transition-colors',
              showVoiceRecorder
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100'
            )}
            disabled={disabled}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht..."
            disabled={disabled}
            rows={1}
            className={clsx(
              'w-full px-4 py-2.5 rounded-2xl border border-gray-200',
              'bg-white text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'resize-none overflow-hidden transition-all duration-200',
              'max-h-32'
            )}
            style={{
              minHeight: '44px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={clsx(
            'p-3 rounded-full transition-all duration-200',
            message.trim()
              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:shadow-xl active:scale-95'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
