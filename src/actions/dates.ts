'use server';

import { eq, or, and } from 'drizzle-orm';
import { db, dateEvents, couples, users } from '@/db';
import { requireAuth } from '@/lib/auth';
import { getPusherServer, EVENTS, getCoupleChannel } from '@/lib/pusher';

async function getUserCouple(userId: string) {
  const [couple] = await db
    .select()
    .from(couples)
    .where(or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)));
  return couple;
}

export async function getDateEvents(month?: number, year?: number) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    return { events: [] };
  }

  const events = await db
    .select()
    .from(dateEvents)
    .where(eq(dateEvents.coupleId, couple.id));

  // Get creator info for each event
  const eventsWithCreator = await Promise.all(
    events.map(async (event) => {
      const [creator] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, event.createdById));
      return { ...event, createdBy: creator };
    })
  );

  return { events: eventsWithCreator };
}

export async function createDateEvent(data: {
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
}) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    throw new Error('Je hebt nog geen partner gekoppeld');
  }

  if (!data.title.trim()) {
    throw new Error('Titel is verplicht');
  }

  if (!data.date) {
    throw new Error('Datum is verplicht');
  }

  const [event] = await db
    .insert(dateEvents)
    .values({
      coupleId: couple.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      date: data.date,
      time: data.time || null,
      location: data.location?.trim() || null,
      createdById: user.id,
    })
    .returning();

  const eventWithCreator = {
    ...event,
    createdBy: { id: user.id, name: user.name },
  };

  // Broadcast via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.DATE_NEW, {
      event: eventWithCreator,
    });
  }

  return eventWithCreator;
}

export async function updateDateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
  }
) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    throw new Error('Je hebt nog geen partner gekoppeld');
  }

  // Check if event exists and belongs to couple
  const [existing] = await db
    .select()
    .from(dateEvents)
    .where(and(eq(dateEvents.id, id), eq(dateEvents.coupleId, couple.id)));

  if (!existing) {
    throw new Error('Event niet gevonden');
  }

  const [event] = await db
    .update(dateEvents)
    .set({
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.time !== undefined && { time: data.time || null }),
      ...(data.location !== undefined && { location: data.location?.trim() || null }),
      updatedAt: new Date(),
    })
    .where(eq(dateEvents.id, id))
    .returning();

  const [creator] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, event.createdById));

  const eventWithCreator = {
    ...event,
    createdBy: creator,
  };

  // Broadcast via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.DATE_UPDATE, {
      event: eventWithCreator,
    });
  }

  return eventWithCreator;
}

export async function deleteDateEvent(id: string) {
  const { user } = await requireAuth();
  const couple = await getUserCouple(user.id);

  if (!couple) {
    throw new Error('Je hebt nog geen partner gekoppeld');
  }

  // Check if event exists and belongs to couple
  const [existing] = await db
    .select()
    .from(dateEvents)
    .where(and(eq(dateEvents.id, id), eq(dateEvents.coupleId, couple.id)));

  if (!existing) {
    throw new Error('Event niet gevonden');
  }

  await db.delete(dateEvents).where(eq(dateEvents.id, id));

  // Broadcast via Pusher
  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(getCoupleChannel(couple.id), EVENTS.DATE_DELETE, {
      eventId: id,
    });
  }

  return { success: true };
}
