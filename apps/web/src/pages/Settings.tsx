import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { DateCounter } from '../components/features/DateCounter';
import * as api from '../lib/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const { partner, reset: resetChat } = useChatStore();

  const [name, setName] = useState(user?.name || '');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadCouple = async () => {
      try {
        const response = await api.getCouple();
        if (response.couple?.anniversaryDate) {
          setAnniversaryDate(response.couple.anniversaryDate);
        }
      } catch (error) {
        console.error('Failed to load couple:', error);
      }
    };
    loadCouple();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.updateProfile({ name: name.trim() });
      updateUser(response.user);
      setMessage('Profiel bijgewerkt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Fout bij bijwerken profiel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAnniversary = async () => {
    if (!anniversaryDate) return;

    setIsLoading(true);
    try {
      await api.updateCouple({ anniversaryDate: new Date(anniversaryDate) });
      setMessage('Datum bijgewerkt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Fout bij bijwerken datum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    } finally {
      logout();
      resetChat();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="glass border-b border-gray-100 safe-top sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Instellingen</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Jouw profiel</h2>

          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={user?.avatarUrl}
              name={user?.name || 'User'}
              size="lg"
            />
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Naam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jouw naam"
            />

            <Button
              onClick={handleUpdateProfile}
              isLoading={isLoading}
              disabled={name === user?.name}
              className="w-full"
            >
              Opslaan
            </Button>
          </div>
        </motion.section>

        {/* Partner Section */}
        {partner && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4">Je partner</h2>

            <div className="flex items-center gap-4">
              <Avatar
                src={partner.avatarUrl}
                name={partner.name}
                size="lg"
              />
              <div>
                <p className="font-medium">{partner.name}</p>
                <p className="text-sm text-gray-500">
                  Laatst gezien {format(new Date(partner.lastSeen), 'PPp', { locale: nl })}
                </p>
              </div>
              <span className="ml-auto text-3xl animate-pulse-heart">💕</span>
            </div>
          </motion.section>
        )}

        {/* Anniversary Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Jullie relatie</h2>

          <div className="space-y-4">
            <Input
              type="date"
              label="Samen sinds"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
            />

            <Button
              onClick={handleUpdateAnniversary}
              isLoading={isLoading}
              disabled={!anniversaryDate}
              className="w-full"
            >
              Datum opslaan
            </Button>
          </div>

          {anniversaryDate && (
            <div className="mt-6">
              <DateCounter
                anniversaryDate={new Date(anniversaryDate)}
              />
            </div>
          )}
        </motion.section>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-green-600 font-medium"
          >
            {message}
          </motion.div>
        )}

        {/* Invite Partner */}
        {!partner && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4">Partner uitnodigen</h2>
            <p className="text-gray-500 mb-4">
              Je hebt nog geen partner gekoppeld. Nodig je geliefde uit!
            </p>
            <Button
              onClick={() => navigate('/invite')}
              variant="love"
              className="w-full"
            >
              Partner uitnodigen
            </Button>
          </motion.section>
        )}

        {/* Logout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-red-500 hover:bg-red-50"
          >
            Uitloggen
          </Button>
        </motion.section>

        {/* App info */}
        <p className="text-center text-xs text-gray-400 pt-4">
          PureLiefde v1.0.0<br />
          Met liefde gemaakt 💕
        </p>
      </main>
    </div>
  );
}
