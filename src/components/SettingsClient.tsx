'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { logout, updateProfile } from '@/actions/auth';
import { updateAnniversary } from '@/actions/couple';
import { uploadFile } from '@/actions/upload';
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
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [anniversary, setAnniversary] = useState(couple?.anniversaryDate || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadFile(formData);
      setAvatarUrl(result.url);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload mislukt');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: { name?: string; avatarUrl?: string } = {};
      if (name !== user.name) updates.name = name;
      if (avatarUrl !== (user.avatarUrl || '')) updates.avatarUrl = avatarUrl;

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
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
            {/* Avatar met upload */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden group"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                name[0].toUpperCase()
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </button>
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
