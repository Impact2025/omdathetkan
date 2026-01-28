'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Message, User, Reaction } from '@/db/schema';

interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  reactions: Reaction[];
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isSent: boolean;
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const renderContent = () => {
    switch (message.messageType) {
      case 'emoji':
        return <span className="text-5xl">{message.content}</span>;

      case 'sticker':
        return (
          <motion.span
            className="text-7xl block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {message.content}
          </motion.span>
        );

      case 'image':
        return (
          <>
            <div className="relative max-w-xs">
              {!imageLoaded && !imageFailed && (
                <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse" />
              )}
              {imageFailed && (
                <div className="w-48 h-32 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-red-400">Afbeelding niet gevonden</span>
                </div>
              )}
              <img
                src={message.mediaUrl!}
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
                    src={message.mediaUrl!}
                    alt="Photo"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case 'video':
        return (
          <video
            src={message.mediaUrl!}
            controls
            className="max-w-xs rounded-lg"
            preload="metadata"
          />
        );

      case 'voice':
        return (
          <audio
            src={message.mediaUrl!}
            controls
            className="min-w-[200px]"
            preload="metadata"
          />
        );

      case 'youtube':
        return (
          <div className="relative w-72 aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${message.mediaUrl}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        );

      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  const isMediaMessage = ['image', 'video', 'emoji', 'sticker', 'youtube'].includes(message.messageType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={clsx(
        'flex items-end gap-2 max-w-[85%]',
        isSent ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isSent && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {message.sender.name[0].toUpperCase()}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={clsx(
            'max-w-prose',
            isMediaMessage
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
          <div className={clsx('flex gap-1', isSent ? 'justify-end' : 'justify-start')}>
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

        {/* Timestamp */}
        <div
          className={clsx(
            'flex items-center gap-1 text-xs text-gray-500',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{format(new Date(message.createdAt), 'HH:mm', { locale: nl })}</span>
          {isSent && (
            <span className={clsx(message.readAt && 'text-primary-500')}>
              {message.readAt ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
