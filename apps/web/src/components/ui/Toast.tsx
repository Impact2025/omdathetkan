import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastType } from '../../stores/toastStore';

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colorMap: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    icon: 'bg-green-500 text-white',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: 'bg-red-500 text-white',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    icon: 'bg-yellow-500 text-white',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    icon: 'bg-blue-500 text-white',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const colors = colorMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`${colors.bg} rounded-lg shadow-lg p-4 flex items-start gap-3 pointer-events-auto`}
            >
              <span
                className={`${colors.icon} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold`}
              >
                {iconMap[toast.type]}
              </span>
              <p className={`${colors.text} text-sm flex-1`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`${colors.text} opacity-60 hover:opacity-100 transition-opacity`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
