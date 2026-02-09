import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { lt } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function archiveMessages() {
  // Calculate start of today (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`Archivering berichten van voor ${today.toISOString()}...`);

  // Archive all messages created before today
  const result = await db
    .update(schema.messages)
    .set({ archivedAt: new Date() })
    .where(lt(schema.messages.createdAt, today));

  console.log('✓ Berichten gearchiveerd!');
  console.log(`Datum/tijd: ${new Date().toISOString()}`);
  console.log(`Berichten van voor ${today.toLocaleDateString('nl-NL')} zijn nu gearchiveerd`);
}

archiveMessages().catch(console.error);
