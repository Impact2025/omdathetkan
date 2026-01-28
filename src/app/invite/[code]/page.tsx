import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { acceptInvite } from '@/actions/couple';

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getSession();
  const { code } = await params;

  if (!session) {
    redirect(`/login?redirect=/invite/${code}`);
  }

  try {
    await acceptInvite(code);
    redirect('/chat');
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">😢</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Oeps!</h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Er ging iets mis'}
          </p>
          <a href="/invite" className="btn-primary inline-block">
            Terug
          </a>
        </div>
      </div>
    );
  }
}
