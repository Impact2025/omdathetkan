'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">😢</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Er ging iets mis</h1>
        <p className="text-gray-500 mb-4">Probeer het opnieuw.</p>
        <button onClick={reset} className="btn-primary">
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
