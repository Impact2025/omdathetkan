import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const formData = await request.formData();
  const socketId = formData.get('socket_id') as string;
  const channel = formData.get('channel_name') as string;

  // Authorize private channels
  if (channel.startsWith('private-')) {
    const auth = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
