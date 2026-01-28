import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import * as api from '../lib/api';

export default function Invite() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'create' | 'accept'>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.createInvite(email || undefined);
      setGeneratedCode(response.inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon uitnodiging niet maken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await api.acceptInvite({ inviteCode: inviteCode.trim() });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ongeldige of verlopen code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      {/* Header */}
      <header className="safe-top">
        <div className="flex items-center gap-4 py-3">
          <button
            onClick={() => mode === 'choose' ? navigate('/') : setMode('choose')}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Partner koppelen</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto mt-8">
        {mode === 'choose' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <span className="text-6xl">💑</span>
              <h2 className="text-2xl font-bold mt-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Koppel je partner
              </h2>
              <p className="text-gray-500 mt-2">
                Begin samen te chatten door je partner uit te nodigen of een code te gebruiken
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setMode('create')}
                variant="love"
                size="lg"
                className="w-full"
              >
                <span className="mr-2">💌</span>
                Partner uitnodigen
              </Button>

              <Button
                onClick={() => setMode('accept')}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                <span className="mr-2">🔑</span>
                Ik heb een code
              </Button>
            </div>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Uitnodiging maken</h2>

              {!generatedCode ? (
                <div className="space-y-4">
                  <Input
                    type="email"
                    label="E-mail van je partner (optioneel)"
                    placeholder="partner@email.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}

                  <Button
                    onClick={handleCreateInvite}
                    variant="love"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    Code genereren
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Deel deze code met je partner:
                  </p>

                  <div className="relative">
                    <div className="bg-gray-100 rounded-xl p-4 text-center">
                      <span className="text-2xl font-mono font-bold tracking-widest">
                        {generatedCode}
                      </span>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    Deze code is 7 dagen geldig
                  </p>

                  <Button
                    onClick={() => {
                      setGeneratedCode('');
                      setEmail('');
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Nieuwe code maken
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {mode === 'accept' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Code invoeren</h2>

              <div className="space-y-4">
                <Input
                  label="Uitnodigingscode"
                  placeholder="ABC123XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="text-center text-xl font-mono tracking-widest"
                />

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  onClick={handleAcceptInvite}
                  variant="love"
                  isLoading={isLoading}
                  disabled={!inviteCode.trim()}
                  className="w-full"
                >
                  Koppelen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
