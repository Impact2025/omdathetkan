import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';
import type { Env, Variables, JWTPayload } from '../types';

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: JWTPayload };

    c.set('userId', payload.sub);
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
}

export async function createToken(
  userId: string,
  email: string,
  jwtSecret: string
): Promise<string> {
  const secret = new TextEncoder().encode(jwtSecret);

  return await new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}
