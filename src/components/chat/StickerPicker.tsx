'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STICKERS, type StickerCategory } from '@/lib/constants';

interface StickerPickerProps {
  onSelectSticker: (emoji: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<StickerCategory, { icon: string; label: string }> = {
  liefde: { icon: '💕', label: 'Liefde' },
  koppel: { icon: '👫', label: 'Koppel' },
  emoties: { icon: '😍', label: 'Emoties' },
};

export function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('liefde');

  const handleStickerClick = (emoji: string) => {
    onSelectSticker(emoji);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-72"
    >
      {/* Category tabs */}
      <div className="flex border-b border-gray-100">
        {(Object.keys(STICKERS) as StickerCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-2 px-3 text-center transition-colors ${
              activeCategory === category
                ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{CATEGORY_ICONS[category].icon}</span>
            <span className="text-xs block">{CATEGORY_ICONS[category].label}</span>
          </button>
        ))}
      </div>

      {/* Stickers grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="p-3 grid grid-cols-4 gap-2 max-h-48 overflow-y-auto"
        >
          {STICKERS[activeCategory].map((sticker, index) => (
            <motion.button
              key={sticker.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => handleStickerClick(sticker.emoji)}
              className="text-3xl p-2 hover:bg-gray-100 rounded-xl transition-colors hover:scale-110 active:scale-95"
              title={sticker.name}
            >
              {sticker.emoji}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
