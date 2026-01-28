import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { users, magicLinks } from '../db/schema';
import { createToken, authMiddleware } from '../middleware/auth';
import { loginRateLimit } from '../middleware/rateLimit';
import type { Env, Variables } from '../types';
import type { LoginRequest, VerifyTokenRequest, AuthResponse } from '@pureliefde/shared';

// Email regex for proper validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Request magic link
auth.post('/login', loginRateLimit, async (c) => {
  const { email } = await c.req.json<LoginRequest>();

  if (!email || !EMAIL_REGEX.test(email) || email.length > 255) {
    throw new HTTPException(400, { message: 'Valid email is required' });
  }

  const db = c.get('db');
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(magicLinks).values({
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  // In development, log token to console (never expose in response)
  if (c.env.ENVIRONMENT === 'development') {
    console.log(`[DEV] Magic link token for ${email}: ${token}`);
  }

  // TODO: Send email with magic link in production
  return c.json({
    message: 'Check your email for the login link',
  });
});

// Verify magic link token
auth.post('/verify', async (c) => {
  const { token } = await c.req.json<VerifyTokenRequest>();

  if (!token) {
    throw new HTTPException(400, { message: 'Token is required' });
  }

  const db = c.get('db');

  // Find and validate magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token));

  if (!magicLink) {
    throw new HTTPException(400, { message: 'Invalid token' });
  }

  if (magicLink.usedAt) {
    throw new HTTPException(400, { message: 'Token already used' });
  }

  if (new Date() > magicLink.expiresAt) {
    throw new HTTPException(400, { message: 'Token expired' });
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, magicLink.email));

  if (!user) {
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: magicLink.email,
        name: magicLink.email.split('@')[0],
      })
      .returning();
    user = newUser;
  }

  // Update last seen
  await db
    .update(users)
    .set({ lastSeen: new Date() })
    .where(eq(users.id, user.id));

  // Create JWT
  const jwt = await createToken(user.id, user.email, c.env.JWT_SECRET);

  const response: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      partnerId: user.partnerId,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
    },
    token: jwt,
  };

  return c.json(response);
});

// Get current user
auth.get('/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  // Update last seen
  await db
    .update(users)
    .set({ lastSeen: new Date() })
    .where(eq(users.id, userId));

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      partnerId: user.partnerId,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
    },
  });
});

// Update user profile
auth.patch('/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const updates = await c.req.json<{ name?: string; avatarUrl?: string }>();

  const [user] = await db
    .update(users)
    .set({
      ...(updates.name && { name: updates.name }),
      ...(updates.avatarUrl && { avatarUrl: updates.avatarUrl }),
    })
    .where(eq(users.id, userId))
    .returning();

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      partnerId: user.partnerId,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
    },
  });
});

// Development-only: Direct login by email (no magic link)
auth.post('/dev-login', async (c) => {
  if (c.env.ENVIRONMENT !== 'development') {
    throw new HTTPException(404, { message: 'Not found' });
  }

  const { email } = await c.req.json<{ email: string }>();

  if (!email) {
    throw new HTTPException(400, { message: 'Email is required' });
  }

  const db = c.get('db');

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  // Update last seen
  await db
    .update(users)
    .set({ lastSeen: new Date() })
    .where(eq(users.id, user.id));

  // Create JWT
  const jwt = await createToken(user.id, user.email, c.env.JWT_SECRET);

  console.log(`[DEV] Direct login for ${email}`);

  const response: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      partnerId: user.partnerId,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
    },
    token: jwt,
  };

  return c.json(response);
});

// Logout (client-side only, but useful for analytics)
auth.post('/logout', authMiddleware, async (c) => {
  // In a stateless JWT system, logout is client-side
  // But we can update last seen
  const db = c.get('db');
  const userId = c.get('userId');

  await db
    .update(users)
    .set({ lastSeen: new Date() })
    .where(eq(users.id, userId));

  return c.json({ message: 'Logged out' });
});

export default auth;
