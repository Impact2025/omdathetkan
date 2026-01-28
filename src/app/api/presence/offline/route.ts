import { NextRequest, NextResponse } from 'next/server';
import { sendOfflinePresence } from '@/actions/messages';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const { userId, coupleId } = JSON.parse(body);

    if (!userId || !coupleId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await sendOfflinePresence(userId, coupleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send offline presence:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
