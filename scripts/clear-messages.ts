import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function clearMessages() {
  await sql`DELETE FROM reactions`;
  await sql`DELETE FROM messages`;
  console.log('Alle berichten verwijderd');
}

clearMessages().catch(console.error);
