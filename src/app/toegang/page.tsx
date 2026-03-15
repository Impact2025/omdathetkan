'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAccessKey } from './actions';

export default function ToegangsPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError(false);

    const result = await verifyAccessKey(code);
    if (result.success) {
      router.replace('/');
    } else {
      setError(true);
      setCode('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          placeholder="Toegangscode"
          className={`w-full px-4 py-3 border rounded-lg text-center text-lg tracking-widest
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            focus:outline-none focus:border-gray-500 transition-colors`}
          autoFocus
          autoComplete="off"
          disabled={loading}
        />
        {error && (
          <p className="text-red-400 text-sm text-center">Onjuiste code</p>
        )}
        <button
          type="submit"
          disabled={loading || !code}
          className="w-full py-3 bg-gray-800 text-white rounded-lg disabled:opacity-40 transition-opacity"
        >
          {loading ? '...' : 'Verder'}
        </button>
      </form>
    </div>
  );
}
