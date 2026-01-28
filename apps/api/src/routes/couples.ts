import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq, or, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { users, couples, invites } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { inviteRateLimit } from '../middleware/rateLimit';
import type { Env, Variables } from '../types';
import type { InvitePartnerRequest, AcceptInviteRequest, UpdateCoupleRequest } from '@pureliefde/shared';

const couplesRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
couplesRoute.use('*', authMiddleware);

// Get couple info
couplesRoute.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');

  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)));

  if (!couple) {
    return c.json({ couple: null });
  }

  // Get partner info
  const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
  const [partner] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(eq(users.id, partnerId));

  return c.json({
    couple: {
      id: couple.id,
      anniversaryDate: couple.anniversaryDate,
      createdAt: couple.createdAt,
      partner,
    },
  });
});

// Update couple (anniversary date, etc.)
couplesRoute.patch('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const updates = await c.req.json<UpdateCoupleRequest>();

  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)));

  if (!couple) {
    throw new HTTPException(404, { message: 'No couple found' });
  }

  const [updatedCouple] = await db
    .update(couples)
    .set({
      ...(updates.anniversaryDate && { anniversaryDate: updates.anniversaryDate.toString() }),
    })
    .where(eq(couples.id, couple.id))
    .returning();

  return c.json({ couple: updatedCouple });
});

// Create invite for partner
couplesRoute.post('/invite', inviteRateLimit, async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { email } = await c.req.json<InvitePartnerRequest>();

  // Check if user already has a partner
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (user.partnerId) {
    throw new HTTPException(400, { message: 'You already have a partner' });
  }

  // Check for existing pending invites
  const existingInvite = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.inviterId, userId),
        eq(invites.usedAt, null as unknown as Date)
      )
    );

  // Generate invite code
  const code = nanoid(10).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invites).values({
    code,
    inviterId: userId,
    inviteeEmail: email?.toLowerCase(),
    expiresAt,
  });

  return c.json({
    inviteCode: code,
    expiresAt,
  });
});

// Accept invite from partner
couplesRoute.post('/accept', inviteRateLimit, async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { inviteCode } = await c.req.json<AcceptInviteRequest>();

  // Check if user already has a partner
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (user.partnerId) {
    throw new HTTPException(400, { message: 'You already have a partner' });
  }

  // Find invite
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.code, inviteCode.toUpperCase()));

  if (!invite) {
    throw new HTTPException(404, { message: 'Invite not found' });
  }

  if (invite.usedAt) {
    throw new HTTPException(400, { message: 'Invite already used' });
  }

  if (new Date() > invite.expiresAt) {
    throw new HTTPException(400, { message: 'Invite expired' });
  }

  if (invite.inviterId === userId) {
    throw new HTTPException(400, { message: 'Cannot accept your own invite' });
  }

  // Mark invite as used
  await db
    .update(invites)
    .set({ usedAt: new Date() })
    .where(eq(invites.id, invite.id));

  // Create couple
  const [couple] = await db
    .insert(couples)
    .values({
      user1Id: invite.inviterId,
      user2Id: userId,
    })
    .returning();

  // Update both users with partner IDs
  await db
    .update(users)
    .set({ partnerId: userId })
    .where(eq(users.id, invite.inviterId));

  await db
    .update(users)
    .set({ partnerId: invite.inviterId })
    .where(eq(users.id, userId));

  // Get partner info
  const [partner] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(eq(users.id, invite.inviterId));

  return c.json({
    couple: {
      id: couple.id,
      anniversaryDate: couple.anniversaryDate,
      createdAt: couple.createdAt,
      partner,
    },
  });
});

export default couplesRoute;
