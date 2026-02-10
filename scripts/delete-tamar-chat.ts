import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, or } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function deleteTamarChat() {
  // Find Tamar's user
  const [tamar] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.name, 'Tamar'));

  if (!tamar) {
    console.log('User Tamar not found');
    return;
  }

  console.log('Found Tamar:', tamar.id);

  // Find the couple that includes Tamar
  const [couple] = await db
    .select()
    .from(schema.couples)
    .where(or(
      eq(schema.couples.user1Id, tamar.id),
      eq(schema.couples.user2Id, tamar.id)
    ));

  if (!couple) {
    console.log('No couple found for Tamar');
    return;
  }

  console.log('Found couple:', couple.id);

  // First delete reactions for messages in this couple
  const messagesToDelete = await db
    .select({ id: schema.messages.id })
    .from(schema.messages)
    .where(eq(schema.messages.coupleId, couple.id));

  for (const msg of messagesToDelete) {
    await db.delete(schema.reactions).where(eq(schema.reactions.messageId, msg.id));
  }

  console.log(`Deleted reactions for ${messagesToDelete.length} messages`);

  // Delete all messages in this couple's chat
  const result = await db
    .delete(schema.messages)
    .where(eq(schema.messages.coupleId, couple.id));

  console.log('Deleted messages for couple');
}

deleteTamarChat().catch(console.error);
