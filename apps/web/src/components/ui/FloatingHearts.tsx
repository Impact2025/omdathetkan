import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heart {
  id: number;
  x: number;
  emoji: string;
}

interface FloatingHeartsProps {
  trigger?: number; // Change this to trigger new hearts
}

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💓', '💘', '💝', '💞'];

export function FloatingHearts({ trigger }: FloatingHeartsProps) {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    if (trigger) {
      const newHearts: Heart[] = [];
      const count = Math.floor(Math.random() * 3) + 3; // 3-5 hearts

      for (let i = 0; i < count; i++) {
        newHearts.push({
          id: Date.now() + i,
          x: Math.random() * 100,
          emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
        });
      }

      setHearts((prev) => [...prev, ...newHearts]);

      // Clean up old hearts
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
      }, 3000);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, y: '100vh', x: `${heart.x}vw`, scale: 0.5 }}
            animate={{ opacity: 1, y: '-10vh', scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 2.5,
              ease: 'easeOut',
              opacity: { duration: 0.3 },
            }}
            className="absolute text-4xl"
            style={{ left: `${heart.x}%` }}
          >
            {heart.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
