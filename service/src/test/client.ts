import { createFetchRouter } from '@lowerdeck/testing-tools';
import { rpcMux } from '@lowerdeck/rpc-server';
import { createSignalClient } from '../../../clients/typescript/src/index.ts';
import { SignalRPC } from '../controllers';

type ClientOptsLike = {
  endpoint: string;
  headers?: Record<string, string | undefined>;
  getHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
  onRequest?: (d: {
    endpoint: string;
    name: string;
    payload: any;
    headers: Record<string, string | undefined>;
    query?: Record<string, string | undefined>;
  }) => any;
};

const fetchRouter = createFetchRouter();
const signalRpc = rpcMux({ path: '/metorial-signal' }, [SignalRPC]);
const registerInMemoryRoute = (endpoint: string) => {
  fetchRouter.registerRoute(endpoint, request => signalRpc.fetch(request));
};

const defaultEndpoint = 'http://signal.test/metorial-signal';

export const createTestSignalClient = (opts: Partial<ClientOptsLike> = {}) => {
  const endpoint = opts.endpoint ?? defaultEndpoint;
  registerInMemoryRoute(endpoint);
  fetchRouter.install();

  return createSignalClient({
    ...opts,
    endpoint
  } as ClientOptsLike);
};

export const signalClient = createTestSignalClient();
export type SignalTestClient = ReturnType<typeof createTestSignalClient>;
