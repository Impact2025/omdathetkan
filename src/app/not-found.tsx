import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pagina niet gevonden</h1>
        <p className="text-gray-500 mb-4">Deze pagina bestaat niet.</p>
        <Link href="/" className="btn-primary inline-block">
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
