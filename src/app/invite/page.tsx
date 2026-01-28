import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { InviteClient } from '@/components/InviteClient';

export const dynamic = 'force-dynamic';

export default async function InvitePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const couple = await getCouple();

  if (couple) {
    redirect('/chat');
  }

  return <InviteClient user={session.user} />;
}
