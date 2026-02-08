import { redis } from 'bun';
import { SignalApi } from './controllers';
import { db } from './db';

console.log('Server is running');

Bun.serve({
  fetch: SignalApi,
  port: 52050
});

Bun.serve({
  fetch: async _ => {
    try {
      await db.tenant.count();
      await redis.ping();
      return new Response('OK');
    } catch (e) {
      return new Response('Service Unavailable', { status: 503 });
    }
  },
  port: 12121
});

await import('./worker');
