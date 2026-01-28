'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createInvite, acceptInvite } from '@/actions/couple';
import type { User } from '@/db/schema';

interface InviteClientProps {
  user: User;
}

export function InviteClient({ user }: InviteClientProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string; inviteUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const invite = await createInvite();
      setGeneratedInvite(invite);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await acceptInvite(inviteCode.trim());
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedInvite) {
      navigator.clipboard.writeText(generatedInvite.inviteUrl);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center"
            >
              <span className="text-4xl">💑</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800">Hoi {user.name}!</h1>
            <p className="text-gray-500 mt-2">Koppel je partner om te beginnen</p>
          </div>

          {mode === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('create'); handleCreateInvite(); }}
                className="btn-primary w-full"
              >
                Nodig je partner uit
              </button>
              <button
                onClick={() => setMode('join')}
                className="btn-secondary w-full"
              >
                Ik heb een code
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-500 mt-4">Code genereren...</p>
                </div>
              ) : generatedInvite ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">Deel deze code:</p>
                    <p className="text-3xl font-mono font-bold tracking-wider text-primary-600">
                      {generatedInvite.code}
                    </p>
                  </div>
                  <button onClick={copyToClipboard} className="btn-primary w-full">
                    Kopieer link
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Of deel de link: {generatedInvite.inviteUrl}
                  </p>
                </>
              ) : null}
              <button
                onClick={() => setMode('choose')}
                className="btn-secondary w-full"
              >
                Terug
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Voer code in"
                className="input text-center text-2xl font-mono tracking-wider"
                maxLength={8}
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={!inviteCode.trim() || loading}
                className="btn-primary w-full"
              >
                {loading ? 'Bezig...' : 'Koppelen'}
              </button>
              <button
                onClick={() => { setMode('choose'); setError(''); }}
                className="btn-secondary w-full"
              >
                Terug
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
