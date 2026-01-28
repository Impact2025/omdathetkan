import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LOVE_EMOJIS, STICKER_PACKS } from '@pureliefde/shared';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (stickerId: string) => void;
  onClose: () => void;
}

type Tab = 'emoji' | 'sticker';

export function EmojiPicker({ onEmojiSelect, onStickerSelect, onClose }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const [activeStickerPack, setActiveStickerPack] = useState<string>('hearts');

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('emoji')}
          className={clsx(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'emoji'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Emoji
        </button>
        <button
          onClick={() => setActiveTab('sticker')}
          className={clsx(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'sticker'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Stickers
        </button>
        <button
          onClick={onClose}
          className="px-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {activeTab === 'emoji' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-8 gap-1"
          >
            {LOVE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onEmojiSelect(emoji)}
                className="p-2 text-2xl hover:bg-gray-100 rounded-lg transition-colors hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        ) : (
          <div>
            {/* Sticker Pack Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {Object.entries(STICKER_PACKS).map(([key, pack]) => (
                <button
                  key={key}
                  onClick={() => setActiveStickerPack(key)}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors',
                    activeStickerPack === key
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {pack.name}
                </button>
              ))}
            </div>

            {/* Stickers Grid */}
            <motion.div
              key={activeStickerPack}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-4 gap-2"
            >
              {STICKER_PACKS[activeStickerPack as keyof typeof STICKER_PACKS].stickers.map(
                (sticker) => (
                  <button
                    key={sticker}
                    onClick={() => onStickerSelect(sticker)}
                    className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors aspect-square flex items-center justify-center"
                  >
                    {/* Placeholder for actual sticker images */}
                    <span className="text-3xl">
                      {sticker === 'floating-heart' && '💖'}
                      {sticker === 'beating-heart' && '💓'}
                      {sticker === 'growing-heart' && '💗'}
                      {sticker === 'sparkling-heart' && '💖'}
                      {sticker === 'arrow-heart' && '💘'}
                      {sticker === 'ribbon-heart' && '💝'}
                      {sticker === 'kiss-mark' && '💋'}
                      {sticker === 'blowing-kiss' && '😘'}
                      {sticker === 'kissing-couple' && '💏'}
                      {sticker === 'flying-kiss' && '😗'}
                      {sticker === 'warm-hug' && '🤗'}
                      {sticker === 'bear-hug' && '🫂'}
                      {sticker === 'tight-hug' && '🤗'}
                      {sticker === 'group-hug' && '🫂'}
                      {sticker === 'blushing' && '😊'}
                      {sticker === 'shy-smile' && '🥰'}
                      {sticker === 'happy-dance' && '💃'}
                      {sticker === 'love-eyes' && '😍'}
                      {sticker === 'starry-eyes' && '🤩'}
                    </span>
                  </button>
                )
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
