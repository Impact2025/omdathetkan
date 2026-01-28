'use server';

import { eq, or, desc, lt, and } from 'drizzle-orm';
import { db, messages, users, reactions, couples } from '@/db';
import { requireAuth } from '@/lib/auth';
import { getPusherServer, EVENTS, getCoupleChannel } from '@/lib/pusher';
import { LIMITS } from '@/lib/constants';
import { notifyPartner } from '@/lib/push';

async function getUserCouple(userId: string) {
  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)));
  return couple;
}

export async function getMessages(cursor?: string, limit = LIMITS.MESSAGES_PER_PAGE) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    return { messages: [], nextCursor: null };
  }

  const queryLimit = Math.min(limit, LIMITS.MESSAGES_PER_PAGE);

  let messagesList;
  if (cursor) {
    messagesList = await db
      .select()
      .from(messages)
      .where(and(eq(messages.coupleId, couple.id), lt(messages.createdAt, new Date(cursor))))
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

  const hasMore = messagesList.length > queryLimit;
  if (hasMore) messagesList.pop();

  // Get sender info and reactions
  const messagesWithDetails = await Promise.all(
    messagesList.map(async (message) => {
      const [sender] = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, message.senderId));

      const messageReactions = await db
        .select()
        .from(reactions)
        .where(eq(reactions.messageId, message.id));

      return { ...message, sender, reactions: messageReactions };
    })
  );

  return {
    messages: messagesWithDetails.reverse(),
    nextCursor: hasMore ? messagesList[messagesList.length - 1].createdAt.toISOString() : null,
  };
}

export async function sendMessage(data: {
  content?: string;
  messageType?: 'text' | 'emoji' | 'sticker' | 'image' | 'video' | 'voice' | 'youtube' | 'spotify';
  mediaUrl?: string;
}) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    throw new Error('Je hebt nog geen partner gekoppeld');
  }

  if (!data.content && !data.mediaUrl) {
    throw new Error('Bericht mag niet leeg zijn');
  }

  if (data.content && data.content.length > LIMITS.MESSAGE_MAX_LENGTH) {
    throw new Error(`Bericht te lang (max ${LIMITS.MESSAGE_MAX_LENGTH} tekens)`);
  }

  const [message] = await db
    .insert(messages)
    .values({
      coupleId: couple.id,
      senderId: user.id,
      content: data.content || '',
      messageType: data.messageType || 'text',
      mediaUrl: data.mediaUrl,
    })
    .returning();

  const messageWithSender = {
    ...message,
    sender: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
    reactions: [],
  };

  // Broadcast via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.MESSAGE_NEW, {
      message: messageWithSender,
    });
  }

  // Send push notification to partner
  const preview = data.content || (data.messageType === 'image' ? '📷 Foto' : data.messageType === 'video' ? '🎬 Video' : data.messageType === 'voice' ? '🎤 Spraakbericht' : data.messageType === 'youtube' ? '▶️ YouTube' : data.messageType === 'spotify' ? '🎵 Spotify' : '💬 Bericht');
  notifyPartner(user.id, user.name, preview).catch(console.error);

  return messageWithSender;
}

export async function markAsRead(messageId: string) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) return;

  const [message] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.coupleId, couple.id)));

  if (!message || message.senderId === user.id || message.readAt) return;

  await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, messageId));

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.MESSAGE_READ, {
      messageId,
      readAt: new Date(),
    });
  }
}

export async function addReaction(messageId: string, emoji: string) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) throw new Error('Geen couple gevonden');

  // Check existing reaction
  const [existing] = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.messageId, messageId), eq(reactions.userId, user.id), eq(reactions.emoji, emoji)));

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return { removed: true };
  }

  const [reaction] = await db
    .insert(reactions)
    .values({ messageId, userId: user.id, emoji })
    .returning();

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.MESSAGE_REACTION, {
      messageId,
      reaction,
    });
  }

  return { reaction };
}

export async function sendTypingIndicator(isTyping: boolean) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) return;

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(
      getCoupleChannel(couple.id),
      isTyping ? EVENTS.TYPING_START : EVENTS.TYPING_STOP,
      { userId: user.id }
    );
  }
}

export async function updatePresence() {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  // Update lastSeen timestamp
  await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, user.id));

  if (!couple) return;

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.PRESENCE_UPDATE, {
      userId: user.id,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    });
  }
}

export async function sendOfflinePresence(userId: string, coupleId: string) {
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(coupleId), EVENTS.PRESENCE_UPDATE, {
      userId,
      isOnline: false,
      lastSeen: new Date().toISOString(),
    });
  }
}
