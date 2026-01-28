import { pgTable, uuid, varchar, text, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'emoji',
  'sticker',
  'image',
  'video',
  'voice',
  'youtube',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 6 }),
  avatarUrl: text('avatar_url'),
  partnerId: uuid('partner_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  partner: one(users, {
    fields: [users.partnerId],
    references: [users.id],
  }),
  sentMessages: many(messages),
  reactions: many(reactions),
}));

// Couples table
export const couples = pgTable('couples', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1Id: uuid('user1_id').references(() => users.id).notNull(),
  user2Id: uuid('user2_id').references(() => users.id).notNull(),
  anniversaryDate: date('anniversary_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const couplesRelations = relations(couples, ({ one, many }) => ({
  user1: one(users, {
    fields: [couples.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [couples.user2Id],
    references: [users.id],
  }),
  messages: many(messages),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupleId: uuid('couple_id').references(() => couples.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  messageType: messageTypeEnum('message_type').default('text').notNull(),
  mediaUrl: text('media_url'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
  couple: one(couples, {
    fields: [messages.coupleId],
    references: [couples.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  reactions: many(reactions),
}));

// Reactions table
export const reactions = pgTable('reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, {
    fields: [reactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

// Invites table
export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  inviterId: uuid('inviter_id').references(() => users.id).notNull(),
  inviteeEmail: varchar('invitee_email', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Magic link tokens table
export const magicLinks = pgTable('magic_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Push subscriptions table
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Couple = typeof couples.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
