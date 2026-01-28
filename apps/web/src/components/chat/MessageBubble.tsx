import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { MessageWithSender } from '@pureliefde/shared';
import { useAuthStore } from '../../stores/authStore';
import { YouTubeEmbed, findYouTubeUrl } from './YouTubeEmbed';

// Convert R2 public URLs to API proxy URLs for local development
function getMediaUrl(url: string | null): string | null {
  if (!url) return null;
  // If URL points to R2, convert to API proxy
  const r2Match = url.match(/^https:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (r2Match) {
    return `/api/media/${r2Match[1]}`;
  }
  return url;
}

interface MessageBubbleProps {
  message: MessageWithSender;
  onReact?: (emoji: string) => void;
  showAvatar?: boolean;
}

export function MessageBubble({ message, onReact, showAvatar = true }: MessageBubbleProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const isSent = message.senderId === userId;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const renderContent = () => {
    switch (message.messageType) {
      case 'emoji':
        return <span className="text-5xl">{message.content}</span>;

      case 'sticker':
        return (
          <img
            src={`/stickers/${message.content}.gif`}
            alt="Sticker"
            className="w-32 h-32 object-contain"
          />
        );

      case 'image':
        return (
          <>
            <div className="relative max-w-xs">
              {!imageLoaded && !imageFailed && (
                <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {imageFailed && (
                <div className="w-48 h-32 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center gap-1">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span className="text-xs text-red-400">Afbeelding niet gevonden</span>
                </div>
              )}
              <img
                src={getMediaUrl(message.mediaUrl)!}
                alt="Photo"
                className={clsx(
                  'max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity',
                  !imageLoaded && 'hidden'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                onClick={() => setShowLightbox(true)}
              />
            </div>

            {/* Lightbox */}
            <AnimatePresence>
              {showLightbox && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  onClick={() => setShowLightbox(false)}
                >
                  <motion.img
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    src={getMediaUrl(message.mediaUrl)!}
                    alt="Photo"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    onClick={() => setShowLightbox(false)}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case 'video':
        return (
          <video
            src={getMediaUrl(message.mediaUrl)!}
            controls
            className="max-w-xs rounded-lg"
            preload="metadata"
          />
        );

      case 'voice':
        return (
          <audio
            src={getMediaUrl(message.mediaUrl)!}
            controls
            className="min-w-[200px]"
            preload="metadata"
          />
        );

      default: {
        // Check for YouTube links in text messages
        const youtubeData = findYouTubeUrl(message.content);

        if (youtubeData) {
          // Split content to show text separately from embed
          const textWithoutUrl = message.content.replace(youtubeData.url, '').trim();

          return (
            <div className="space-y-2">
              {textWithoutUrl && (
                <p className="whitespace-pre-wrap break-words">{textWithoutUrl}</p>
              )}
              <YouTubeEmbed videoId={youtubeData.videoId} url={youtubeData.url} />
            </div>
          );
        }

        // Check for other URLs and make them clickable
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const parts = message.content.split(urlPattern);

        if (parts.length > 1) {
          return (
            <p className="whitespace-pre-wrap break-words">
              {parts.map((part, index) => {
                if (part.match(urlPattern)) {
                  return (
                    <a
                      key={index}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all"
                    >
                      {part}
                    </a>
                  );
                }
                return part;
              })}
            </p>
          );
        }

        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
      }
    }
  };

  const quickReactions = ['❤️', '😘', '😍', '💕'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'flex items-end gap-2 max-w-[85%]',
        isSent ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !isSent && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-semibold">
          {message.sender.name[0].toUpperCase()}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={clsx(
            'max-w-prose',
            message.messageType === 'emoji' || message.messageType === 'sticker' || message.messageType === 'image' || message.messageType === 'video'
              ? 'bg-transparent'
              : isSent
              ? 'bubble-sent px-4 py-2.5'
              : 'bubble-received px-4 py-2.5'
          )}
        >
          {renderContent()}
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div
            className={clsx(
              'flex gap-1 flex-wrap',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            {message.reactions.map((reaction) => (
              <span
                key={reaction.id}
                className="text-sm bg-white/80 rounded-full px-1.5 py-0.5 shadow-sm"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp and read status */}
        <div
          className={clsx(
            'flex items-center gap-1 text-xs text-gray-500',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          <span>
            {format(new Date(message.createdAt), 'HH:mm', { locale: nl })}
          </span>
          {isSent && (
            <span className={clsx(message.readAt && 'text-primary-500')}>
              {message.readAt ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Quick reactions */}
        {onReact && !isSent && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className="hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
