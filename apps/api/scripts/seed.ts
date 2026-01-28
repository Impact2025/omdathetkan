import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, couples } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL!;

async function seed() {
  console.log('🌱 Seeding database...');

  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set. Create a .env file with DATABASE_URL=your_connection_string');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  // Check existing users
  const existingUsers = await db.select().from(users);
  console.log(`Found ${existingUsers.length} existing users`);

  if (existingUsers.length === 0) {
    // Create Tamar
    const [tamar] = await db.insert(users).values({
      email: 'tamar@pureliefde.nl',
      name: 'Tamar',
    }).returning();
    console.log('✓ Created user: Tamar');

    // Create Vincent
    const [vincent] = await db.insert(users).values({
      email: 'vincent@pureliefde.nl',
      name: 'Vincent',
    }).returning();
    console.log('✓ Created user: Vincent');

    // Link them as partners
    await db.update(users).set({ partnerId: vincent.id }).where(eq(users.id, tamar.id));
    await db.update(users).set({ partnerId: tamar.id }).where(eq(users.id, vincent.id));
    console.log('✓ Linked as partners');

    // Create couple
    const [couple] = await db.insert(couples).values({
      user1Id: tamar.id,
      user2Id: vincent.id,
      anniversaryDate: '2026-01-16',
    }).returning();
    console.log('✓ Created couple with anniversary: 2026-01-16');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nUsers:');
    console.log(`  Tamar: ${tamar.id}`);
    console.log(`  Vincent: ${vincent.id}`);
    console.log(`  Couple: ${couple.id}`);
  } else {
    console.log('Database already has users, skipping seed');
    existingUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email})`);
    });
  }
}

seed().catch(console.error);
