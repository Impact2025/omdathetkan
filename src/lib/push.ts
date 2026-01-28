import webpush from 'web-push';
import { db, pushSubscriptions, users } from '@/db';
import { eq } from 'drizzle-orm';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@pureliefde.nl',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('VAPID keys not configured');
    return;
  }

  try {
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (!subscription) {
      return;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({ title, body, url })
    );
  } catch (error) {
    console.error('Push notification error:', error);
    // Remove invalid subscription
    if ((error as { statusCode?: number }).statusCode === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    }
  }
}

export async function notifyPartner(senderId: string, senderName: string, messagePreview: string) {
  // Get sender's partner
  const [sender] = await db.select().from(users).where(eq(users.id, senderId));
  if (!sender?.partnerId) return;

  await sendPushNotification(
    sender.partnerId,
    senderName,
    messagePreview.length > 50 ? messagePreview.slice(0, 50) + '...' : messagePreview,
    '/chat'
  );
}
