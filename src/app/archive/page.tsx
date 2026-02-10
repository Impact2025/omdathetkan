import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { getArchivedMessages } from '@/actions/messages';
import { ArchiveClient } from '@/components/archive/ArchiveClient';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Only Vincent can access archive
  if (session.user.email !== 'vincent@pureliefde.nl') {
    redirect('/chat');
  }

  const couple = await getCouple();

  if (!couple) {
    redirect('/invite');
  }

  const { messages } = await getArchivedMessages();

  return (
    <ArchiveClient
      initialMessages={messages}
      currentUser={session.user}
      couple={couple}
    />
  );
}
