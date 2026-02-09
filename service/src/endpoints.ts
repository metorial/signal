import { redis } from 'bun';
import { SignalApi } from './controllers';
import { db } from './db';

let server = Bun.serve({
  fetch: SignalApi,
  port: 52050
});

console.log(`Service running on http://localhost:${server.port}`);

Bun.serve({
  fetch: async _ => {
    console.log('Health check');

    try {
      console.log('1');
      await db.tenant.count();
      console.log('2');
      await redis.ping();
      console.log('3');
      return new Response('OK');
    } catch (e) {
      console.log(e);
      return new Response('Service Unavailable', { status: 503 });
    }
  },
  port: 12121
});
