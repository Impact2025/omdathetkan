import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import * as api from '../lib/api';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PIN codes voor users
const PIN_MAP: Record<string, string> = {
  '1601': 'tamar@pureliefde.nl',
  '8222': 'vincent@pureliefde.nl',
};

const MAX_PIN_LENGTH = Math.max(...Object.keys(PIN_MAP).map((k) => k.length));

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    // iOS standalone check
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, MAX_PIN_LENGTH);
    setPin(cleaned);
    setError('');
    if (PIN_MAP[cleaned]) {
      setTimeout(() => handleLogin(undefined, cleaned), 100);
    }
  };

  const handleLogin = async (e?: React.FormEvent, pinValue?: string) => {
    e?.preventDefault();

    const email = PIN_MAP[pinValue ?? pin];
    if (!email) {
      setError('Ongeldige pincode');
      setPin('');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const loginResponse = await api.login({ email }) as { message: string; directLogin?: boolean };
      if (loginResponse.directLogin) {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login mislukt');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-100 via-white to-secondary-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.img
              src="/logo.png"
              alt="PureLiefde"
              className="w-32 h-32 mx-auto mb-4 object-contain"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Voer je pincode in
              </label>
              <div className="flex justify-center gap-2">
                {Array.from({ length: MAX_PIN_LENGTH }, (_, i) => i).map((index) => (
                  <div
                    key={index}
                    className={`w-11 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                      pin[index]
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-200 bg-gray-50 text-gray-300'
                    }`}
                  >
                    {pin[index] ? '•' : ''}
                  </div>
                ))}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="sr-only"
                autoFocus
                maxLength={MAX_PIN_LENGTH}
              />
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (num === 'del') {
                      setPin((prev) => prev.slice(0, -1));
                    } else if (num !== null) {
                      handlePinChange(pin + num);
                    }
                  }}
                  disabled={num === null || isLoading}
                  className={`h-14 rounded-xl text-xl font-semibold transition-all ${
                    num === null
                      ? 'invisible'
                      : num === 'del'
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95'
                  } disabled:opacity-50`}
                >
                  {num === 'del' ? '⌫' : num}
                </button>
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}

            {isLoading && (
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="text-2xl"
                >
                  💕
                </motion.div>
              </div>
            )}
          </form>

          {/* Install Button */}
          <AnimatePresence>
            {!isInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 pt-6 border-t border-gray-100"
              >
                {installPrompt ? (
                  <button
                    onClick={handleInstall}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Installeer App
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Installeer als app
                    </p>
                    {isIOS ? (
                      <p className="text-xs text-gray-500">
                        Tik op{' '}
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L12 14M12 14L8 10M12 14L16 10M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        </span>
                        en dan "Zet op beginscherm"
                      </p>
                    ) : isAndroid ? (
                      <p className="text-xs text-gray-500">
                        Tik op het menu (⋮) en kies "Toevoegen aan startscherm"
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Klik op het installatie-icoon in de adresbalk of via het browsermenu
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
