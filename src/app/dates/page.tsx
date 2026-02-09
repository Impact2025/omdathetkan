import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { getDateEvents } from '@/actions/dates';
import { DatesClient } from '@/components/DatesClient';

export const dynamic = 'force-dynamic';

export default async function DatesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const couple = await getCouple();

  if (!couple) {
    redirect('/invite');
  }

  const { events } = await getDateEvents();

  return (
    <DatesClient
      initialEvents={events}
      currentUser={session.user}
      couple={couple}
    />
  );
}
