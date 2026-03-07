export default function OnderhoudPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Even offline</h1>
        <p className="text-gray-500 leading-relaxed">
          We zijn bezig met onderhoud aan de server. Probeer het over een paar uur opnieuw.
        </p>
      </div>
    </div>
  );
}
