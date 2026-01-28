'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { logout, updateProfile } from '@/actions/auth';
import { updateAnniversary } from '@/actions/couple';
import type { User, Couple } from '@/db/schema';

interface CoupleWithPartner extends Couple {
  partner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'lastSeen'>;
}

interface SettingsClientProps {
  user: User;
  couple: CoupleWithPartner | null;
}

export function SettingsClient({ user, couple }: SettingsClientProps) {
  const [name, setName] = useState(user.name);
  const [anniversary, setAnniversary] = useState(couple?.anniversaryDate || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      if (name !== user.name) {
        await updateProfile({ name });
      }
      if (couple && anniversary !== couple.anniversaryDate) {
        await updateAnniversary(anniversary);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="glass border-b border-white/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Instellingen</h1>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="font-semibold text-gray-800 mb-4">Profiel</h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-2xl font-semibold">
              {name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>

            {couple && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jubileum datum
                </label>
                <input
                  type="date"
                  value={anniversary}
                  onChange={(e) => setAnniversary(e.target.value)}
                  className="input"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Opslaan...' : saved ? '✓ Opgeslagen!' : 'Opslaan'}
            </button>
          </div>
        </motion.div>

        {/* Partner */}
        {couple && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">Partner</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold">
                {couple.partner.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{couple.partner.name}</p>
                <p className="text-sm text-gray-500">Gekoppeld</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Uitloggen
          </button>
        </motion.div>
      </div>
    </div>
  );
}
