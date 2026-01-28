import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { SettingsClient } from '@/components/SettingsClient';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const couple = await getCouple();

  return <SettingsClient user={session.user} couple={couple} />;
}
