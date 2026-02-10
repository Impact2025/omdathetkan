import { config } from 'dotenv';
config({ path: '.env.local' });

import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

console.log('Pusher config check:');
console.log('- APP_ID:', appId ? '✓ set' : '✗ missing');
console.log('- KEY:', key ? '✓ set' : '✗ missing');
console.log('- SECRET:', secret ? '✓ set' : '✗ missing');
console.log('- CLUSTER:', cluster ? '✓ set' : '✗ missing');
console.log('- NEXT_PUBLIC_PUSHER_KEY:', process.env.NEXT_PUBLIC_PUSHER_KEY ? '✓ set' : '✗ missing');
console.log('- NEXT_PUBLIC_PUSHER_CLUSTER:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER ? '✓ set' : '✗ missing');

if (!appId || !key || !secret || !cluster) {
  console.log('\n❌ Pusher not fully configured');
  process.exit(1);
}

const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

console.log('\nTesting Pusher connection...');

pusher.trigger('test-channel', 'test-event', { message: 'Hello from test!' })
  .then(() => {
    console.log('✓ Pusher is working! Real-time messages are enabled.');
  })
  .catch((err) => {
    console.log('✗ Pusher error:', err.message);
  });
