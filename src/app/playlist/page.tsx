import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { getSpotifyMessages } from '@/actions/messages';
import { PlaylistClient } from '@/components/PlaylistClient';

export const dynamic = 'force-dynamic';

export default async function PlaylistPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const couple = await getCouple();

  if (!couple) {
    redirect('/invite');
  }

  const { tracks } = await getSpotifyMessages();

  return (
    <PlaylistClient
      tracks={tracks}
      currentUser={session.user}
    />
  );
}
