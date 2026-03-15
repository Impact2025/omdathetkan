import { NextRequest, NextResponse } from 'next/server';
import { lt, and, isNull } from 'drizzle-orm';
import { db, messages } from '@/db';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const result = await db
    .update(messages)
    .set({ archivedAt: new Date() })
    .where(and(
      lt(messages.createdAt, twoDaysAgo),
      isNull(messages.archivedAt)
    ))
    .returning({ id: messages.id });

  return NextResponse.json({ archived: result.length });
}
