'use server';

import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, couples, users, invites } from '@/db';
import { requireAuth } from '@/lib/auth';

export async function getCouple() {
  const { user } = await requireAuth();

  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, user.id), eq(couples.user2Id, user.id)));

  if (!couple) {
    return null;
  }

  const partnerId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
  const [partner] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(eq(users.id, partnerId));

  return {
    ...couple,
    partner,
  };
}

export async function createInvite() {
  const { user } = await requireAuth();

  // Check if already in a couple
  const existingCouple = await getCouple();
  if (existingCouple) {
    throw new Error('Je bent al gekoppeld aan een partner');
  }

  const code = nanoid(8).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invites).values({
    code,
    inviterId: user.id,
    expiresAt,
  });

  return {
    code,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${code}`,
    expiresAt,
  };
}

export async function acceptInvite(code: string) {
  const { user } = await requireAuth();

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.code, code.toUpperCase()));

  if (!invite) {
    throw new Error('Ongeldige uitnodigingscode');
  }

  if (invite.expiresAt < new Date()) {
    throw new Error('Uitnodiging is verlopen');
  }

  if (invite.usedAt) {
    throw new Error('Uitnodiging is al gebruikt');
  }

  if (invite.inviterId === user.id) {
    throw new Error('Je kunt jezelf niet uitnodigen');
  }

  // Check if either user is already in a couple
  const existingCouple = await db
    .select()
    .from(couples)
    .where(
      or(
        eq(couples.user1Id, user.id),
        eq(couples.user2Id, user.id),
        eq(couples.user1Id, invite.inviterId),
        eq(couples.user2Id, invite.inviterId)
      )
    );

  if (existingCouple.length > 0) {
    throw new Error('Een van jullie is al gekoppeld aan iemand anders');
  }

  // Create couple
  const [couple] = await db
    .insert(couples)
    .values({
      user1Id: invite.inviterId,
      user2Id: user.id,
    })
    .returning();

  // Mark invite as used
  await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.id, invite.id));

  // Update partner references
  await db.update(users).set({ partnerId: user.id }).where(eq(users.id, invite.inviterId));
  await db.update(users).set({ partnerId: invite.inviterId }).where(eq(users.id, user.id));

  return couple;
}

export async function updateAnniversary(date: string) {
  const { user } = await requireAuth();

  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, user.id), eq(couples.user2Id, user.id)));

  if (!couple) {
    throw new Error('Geen couple gevonden');
  }

  await db
    .update(couples)
    .set({ anniversaryDate: date })
    .where(eq(couples.id, couple.id));

  return { success: true };
}
