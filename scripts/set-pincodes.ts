import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function setPincodes() {
  // Update pincodes for the two users
  await sql`UPDATE users SET pincode = '1234' WHERE email = 'tamar@pureliefde.nl'`;
  await sql`UPDATE users SET pincode = '5678' WHERE email = 'vincent@pureliefde.nl'`;

  // Verify
  const users = await sql`SELECT email, pincode FROM users`;
  console.log('Users:', users);
}

setPincodes().catch(console.error);
