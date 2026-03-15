'use server';

import { cookies } from 'next/headers';

export async function verifyAccessKey(code: string): Promise<{ success: boolean }> {
  const siteKey = process.env.SITE_ACCESS_KEY;

  if (!siteKey || code !== siteKey) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set('site_access', siteKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return { success: true };
}
