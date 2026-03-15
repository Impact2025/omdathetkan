'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoLock } from '@/hooks/useAutoLock';
import { loginWithPincode } from '@/actions/auth';

const PROTECTED_PATHS = ['/chat', '/settings', '/dates', '/invite', '/archief', '/playlist'];

export function AutoLock() {
  const pathname = usePathname();
  const { isLocked, unlock } = useAutoLock();
  const [pincode, setPincode] = useState(['', '', '', '', '']);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isProtected = PROTECTED_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (isLocked && isProtected) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isLocked, isProtected]);

  if (!isLocked || !isProtected) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pincode];
    newPin[index] = value.slice(-1);
    setPincode(newPin);
    setError(false);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 4 && value) {
      const full = [...newPin.slice(0, 4), value.slice(-1)].join('');
      if (full.length === 5) handleSubmit(full);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pincode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    const full = code || pincode.join('');
    if (full.length !== 5) return;

    setLoading(true);
    const result = await loginWithPincode(full);
    if (result.success) {
      unlock();
      setPincode(['', '', '', '', '']);
    } else {
      setError(true);
      setPincode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-rose-50"
      >
        <div className="glass rounded-3xl p-8 w-full max-w-sm">
          <div className="flex justify-center gap-3 mb-6">
            {pincode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2
                  ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                  transition-all duration-200 disabled:opacity-50`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">Onjuiste pincode</p>
          )}
          {loading && (
            <div className="flex justify-center mt-2">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
