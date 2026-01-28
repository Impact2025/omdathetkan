'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">📡</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Geen verbinding</h1>
        <p className="text-gray-500 mb-4">Je bent offline. Check je internetverbinding.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
