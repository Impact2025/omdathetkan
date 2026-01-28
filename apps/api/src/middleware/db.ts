import { Context, Next } from 'hono';
import { createDb } from '../db/client';
import type { Env, Variables } from '../types';

export async function dbMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const db = createDb(c.env.DATABASE_URL);
  c.set('db', db);
  await next();
}
