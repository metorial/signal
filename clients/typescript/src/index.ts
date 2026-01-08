import { createClient } from '@lowerdeck/rpc-client';
import { ClientOpts } from '@lowerdeck/rpc-client/dist/shared/clientBuilder';
import type { SignalClient } from '../../../service/src/controllers';

export let createSignalClient = (o: ClientOpts) => createClient<SignalClient>(o);
