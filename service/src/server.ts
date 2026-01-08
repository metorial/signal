import { SignalApi } from './controllers';

console.log('Server is running');

Bun.serve({
  fetch: SignalApi,
  port: 52050
});

await import('./worker');
