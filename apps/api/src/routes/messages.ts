import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq, or, desc, lt, and } from 'drizzle-orm';
import { users, couples, messages, reactions } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { messageRateLimit } from '../middleware/rateLimit';
import type { Env, Variables } from '../types';
import type { SendMessageRequest, GetMessagesRequest, AddReactionRequest } from '@pureliefde/shared';
import { LIMITS } from '@pureliefde/shared';

const messagesRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
messagesRoute.use('*', authMiddleware);

// Helper to get user's couple
async function getUserCouple(db: Variables['db'], userId: string) {
  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)));

  return couple;
}

// Get messages
messagesRoute.get('/', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { limit = 50, cursor } = c.req.query() as GetMessagesRequest;

  const couple = await getUserCouple(db, userId);
  if (!couple) {
    throw new HTTPException(404, { message: 'No couple found. Invite your partner first!' });
  }

  // Build query
  const queryLimit = Math.min(Number(limit), LIMITS.MESSAGES_PER_PAGE);

  let messagesList;
  if (cursor) {
    messagesList = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.coupleId, couple.id),
          lt(messages.createdAt, new Date(cursor))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(queryLimit + 1);
  } else {
    messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.coupleId, couple.id))
      .orderBy(desc(messages.createdAt))
      .limit(queryLimit + 1);
  }

  // Check if there are more messages
  const hasMore = messagesList.length > queryLimit;
  if (hasMore) {
    messagesList.pop();
  }

  // Get sender info and reactions for each message
  const messagesWithDetails = await Promise.all(
    messagesList.map(async (message) => {
      const [sender] = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          lastSeen: users.lastSeen,
        })
        .from(users)
        .where(eq(users.id, message.senderId));

      const messageReactions = await db
        .select()
        .from(reactions)
        .where(eq(reactions.messageId, message.id));

      return {
        ...message,
        sender,
        reactions: messageReactions,
      };
    })
  );

  return c.json({
    messages: messagesWithDetails.reverse(), // Oldest first
    nextCursor: hasMore ? messagesList[messagesList.length - 1].createdAt.toISOString() : null,
  });
});

// Send message
messagesRoute.post('/', messageRateLimit, async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const { content, messageType, mediaUrl } = await c.req.json<SendMessageRequest>();

  if (!content && !mediaUrl) {
    throw new HTTPException(400, { message: 'Message content or media is required' });
  }

  if (content && content.length > LIMITS.MESSAGE_MAX_LENGTH) {
    throw new HTTPException(400, { message: `Message too long (max ${LIMITS.MESSAGE_MAX_LENGTH} characters)` });
  }

  const couple = await getUserCouple(db, userId);
  if (!couple) {
    throw new HTTPException(404, { message: 'No couple found. Invite your partner first!' });
  }

  const [message] = await db
    .insert(messages)
    .values({
      coupleId: couple.id,
      senderId: userId,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
    })
    .returning();

  // Get sender info
  const [sender] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(eq(users.id, userId));

  // Broadcast to WebSocket (if connected)
  try {
    const roomId = c.env.CHAT_ROOM.idFromName(couple.id);
    const room = c.env.CHAT_ROOM.get(roomId);
    await room.fetch('https://internal/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        type: 'message:new',
        payload: {
          message: {
            ...message,
            sender,
            reactions: [],
          },
        },
      }),
    });
  } catch {
    // WebSocket broadcast failed, client will poll
  }

  return c.json({
    message: {
      ...message,
      sender,
      reactions: [],
    },
  });
});

// Mark message as read
messagesRoute.post('/:id/read', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const messageId = c.req.param('id');

  const couple = await getUserCouple(db, userId);
  if (!couple) {
    throw new HTTPException(404, { message: 'No couple found' });
  }

  // Get the message
  const [message] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.coupleId, couple.id)
      )
    );

  if (!message) {
    throw new HTTPException(404, { message: 'Message not found' });
  }

  // Only mark as read if the user is not the sender
  if (message.senderId !== userId && !message.readAt) {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, messageId));

    // Broadcast read receipt
    try {
      const roomId = c.env.CHAT_ROOM.idFromName(couple.id);
      const room = c.env.CHAT_ROOM.get(roomId);
      await room.fetch('https://internal/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          type: 'message:read',
          payload: {
            messageId,
            readAt: new Date(),
          },
        }),
      });
    } catch {
      // WebSocket broadcast failed
    }
  }

  return c.json({ success: true });
});

// Add reaction to message
messagesRoute.post('/:id/reactions', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const messageId = c.req.param('id');
  const { emoji } = await c.req.json<AddReactionRequest>();

  if (!emoji) {
    throw new HTTPException(400, { message: 'Emoji is required' });
  }

  const couple = await getUserCouple(db, userId);
  if (!couple) {
    throw new HTTPException(404, { message: 'No couple found' });
  }

  // Verify message belongs to couple
  const [message] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.coupleId, couple.id)
      )
    );

  if (!message) {
    throw new HTTPException(404, { message: 'Message not found' });
  }

  // Check if user already reacted with this emoji
  const [existingReaction] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, userId),
        eq(reactions.emoji, emoji)
      )
    );

  if (existingReaction) {
    // Remove reaction (toggle off)
    await db
      .delete(reactions)
      .where(eq(reactions.id, existingReaction.id));

    return c.json({ removed: true });
  }

  // Add reaction
  const [reaction] = await db
    .insert(reactions)
    .values({
      messageId,
      userId,
      emoji,
    })
    .returning();

  // Broadcast reaction
  try {
    const roomId = c.env.CHAT_ROOM.idFromName(couple.id);
    const room = c.env.CHAT_ROOM.get(roomId);
    await room.fetch('https://internal/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        type: 'message:reaction',
        payload: {
          reaction,
          messageId,
        },
      }),
    });
  } catch {
    // WebSocket broadcast failed
  }

  return c.json({ reaction });
});

// Delete reaction
messagesRoute.delete('/:id/reactions/:reactionId', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const reactionId = c.req.param('reactionId');

  // Verify ownership
  const [reaction] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.id, reactionId),
        eq(reactions.userId, userId)
      )
    );

  if (!reaction) {
    throw new HTTPException(404, { message: 'Reaction not found' });
  }

  await db
    .delete(reactions)
    .where(eq(reactions.id, reactionId));

  return c.json({ success: true });
});

export default messagesRoute;
