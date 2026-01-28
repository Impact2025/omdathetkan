import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCouple } from '@/actions/couple';
import { getMessages } from '@/actions/messages';
import { ChatClient } from '@/components/chat/ChatClient';

export default async function ChatPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const couple = await getCouple();

  if (!couple) {
    redirect('/invite');
  }

  const { messages } = await getMessages();

  return (
    <ChatClient
      initialMessages={messages}
      currentUser={session.user}
      couple={couple}
    />
  );
}
