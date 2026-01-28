import type { Database } from './db/client';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  MEDIA_BUCKET: R2Bucket;
  CHAT_ROOM: DurableObjectNamespace;
  ENVIRONMENT: string;
}

export interface Variables {
  db: Database;
  userId: string;
  coupleId: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
