import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Avatar } from '../ui/Avatar';

interface PartnerStatusProps {
  name: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  isTyping: boolean;
  lastSeen?: Date;
  onClick?: () => void;
}

export function PartnerStatus({
  name,
  avatarUrl,
  isOnline,
  isTyping,
  lastSeen,
  onClick,
}: PartnerStatusProps) {
  const getStatusText = () => {
    if (isTyping) return 'is aan het typen...';
    if (isOnline) return 'Online';
    if (lastSeen) {
      return `Laatst gezien ${formatDistanceToNow(lastSeen, {
        addSuffix: true,
        locale: nl,
      })}`;
    }
    return 'Offline';
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-white/50 transition-colors"
    >
      <Avatar
        src={avatarUrl}
        name={name}
        size="md"
        isOnline={isOnline}
      />

      <div className="flex flex-col items-start">
        <span className="font-semibold text-gray-900">{name}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={getStatusText()}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-sm text-gray-500 flex items-center gap-1"
          >
            {isTyping && (
              <span className="flex gap-0.5">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                >
                  .
                </motion.span>
              </span>
            )}
            {getStatusText()}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Love indicator */}
      <span className="ml-auto text-2xl animate-pulse-heart">💕</span>
    </motion.button>
  );
}
