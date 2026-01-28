import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env, Variables } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on worker restart, which is fine for rate limiting)
const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, keyGenerator } = config;

  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    // Periodically cleanup expired entries
    if (Math.random() < 0.01) {
      cleanupExpired();
    }

    // Generate key based on IP and optional custom key
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const customKey = keyGenerator ? keyGenerator(c) : '';
    const key = `${ip}:${customKey}`;

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      throw new HTTPException(429, {
        message: `Too many requests. Please try again in ${retryAfter} seconds.`
      });
    }

    await next();
  };
}

// Pre-configured rate limiters
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (c) => 'login',
});

export const inviteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (c) => 'invite',
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (c) => 'message',
});
