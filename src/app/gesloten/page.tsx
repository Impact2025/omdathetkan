'use client';

import { useRouter } from 'next/navigation';

export default function GeslotenPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6">
      <div className="text-white/20 text-8xl select-none">🔒</div>
      <button
        onClick={() => router.push('/login')}
        className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-colors"
      >
        Ontgrendelen
      </button>
    </div>
  );
}
