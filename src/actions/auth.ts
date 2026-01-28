'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, users, magicLinks } from '@/db';
import { createToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function loginWithPincode(pincode: string) {
  try {
    if (!pincode || pincode.length !== 5) {
      return { success: false, error: 'Ongeldige pincode' };
    }

    // Find user with this pincode
    const [user] = await db.select().from(users).where(eq(users.pincode, pincode));

    if (!user) {
      return { success: false, error: 'Ongeldige pincode' };
    }

    const token = await createToken(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login mislukt: ' + (error instanceof Error ? error.message : 'Onbekende fout') };
  }
}

export async function login(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  // For dev: direct login for test accounts
  if (normalizedEmail === 'tamar@pureliefde.nl' || normalizedEmail === 'vincent@pureliefde.nl') {
    let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      [user] = await db.insert(users).values({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
      }).returning();
    }

    const token = await createToken(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, directLogin: true };
  }

  // Production: create magic link
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(magicLinks).values({
    email: normalizedEmail,
    token,
    expiresAt,
  });

  // TODO: Send email with magic link
  console.log(`Magic link for ${normalizedEmail}: ${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`);

  return { success: true, message: 'Check je email voor de login link!' };
}

export async function verifyMagicLink(token: string) {
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token));

  if (!magicLink || magicLink.usedAt || magicLink.expiresAt < new Date()) {
    return { error: 'Ongeldige of verlopen link' };
  }

  // Mark as used
  await db.update(magicLinks).set({ usedAt: new Date() }).where(eq(magicLinks.id, magicLink.id));

  // Get or create user
  let [user] = await db.select().from(users).where(eq(users.email, magicLink.email));

  if (!user) {
    [user] = await db.insert(users).values({
      email: magicLink.email,
      name: magicLink.email.split('@')[0],
    }).returning();
  }

  const jwtToken = await createToken(user.id, user.email);
  const cookieStore = await cookies();
  cookieStore.set('token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/chat');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}

export async function updateProfile(data: { name?: string; avatarUrl?: string }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error('Unauthorized');

  const { verifyToken } = await import('@/lib/auth');
  const payload = await verifyToken(token);
  if (!payload) throw new Error('Unauthorized');

  const [user] = await db
    .update(users)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
    })
    .where(eq(users.id, payload.sub))
    .returning();

  return user;
}
