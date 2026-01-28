import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';
import { eq, or } from 'drizzle-orm';
import { dbMiddleware } from './middleware/db';
import authRoutes from './routes/auth';
import messagesRoutes from './routes/messages';
import couplesRoutes from './routes/couples';
import mediaRoutes from './routes/media';
import type { Env, Variables, JWTPayload } from './types';

// Export Durable Object
export { ChatRoom } from './ws/handler';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4090', 'https://pureliefde.pages.dev'],
  credentials: true,
}));
app.use('/api/*', dbMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'PureLiefde API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/messages', messagesRoutes);
app.route('/api/couple', couplesRoutes);
app.route('/api/media', mediaRoutes);

// WebSocket endpoint with JWT validation
app.get('/ws/:coupleId', dbMiddleware, async (c) => {
  const coupleId = c.req.param('coupleId');
  const userId = c.req.query('userId');
  const token = c.req.query('token');

  if (!userId || !token) {
    throw new HTTPException(400, { message: 'Missing userId or token' });
  }

  // Verify JWT token
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: JWTPayload };

    // Verify userId matches token
    if (payload.sub !== userId) {
      throw new HTTPException(401, { message: 'User ID does not match token' });
    }

    // Verify user belongs to this couple
    const db = c.get('db');
    const { couples } = await import('./db/schema');
    const [couple] = await db
      .select()
      .from(couples)
      .where(
        or(
          eq(couples.user1Id, userId),
          eq(couples.user2Id, userId)
        )
      );

    if (!couple || couple.id !== coupleId) {
      throw new HTTPException(403, { message: 'User does not belong to this couple' });
    }
  } catch (err) {
    if (err instanceof HTTPException) {
      throw err;
    }
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  // Get the Durable Object for this couple
  const roomId = c.env.CHAT_ROOM.idFromName(coupleId);
  const room = c.env.CHAT_ROOM.get(roomId);

  // Forward the WebSocket request to the Durable Object
  const url = new URL(c.req.url);
  url.searchParams.set('userId', userId);

  return room.fetch(new Request(url.toString(), {
    headers: c.req.raw.headers,
  }));
});

// Error handling
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
