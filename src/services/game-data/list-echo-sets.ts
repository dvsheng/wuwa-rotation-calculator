import { createServerFn } from '@tanstack/react-start';

import { createFsStore } from './hakushin-api/fs-store';

export interface EchoSetResponseItem {
  id: number;
  name: string;
  tiers: Array<number>;
}

interface EchoSetData {
  en: string;
  tiers: Array<number>;
}

type EchoSetsJson = Record<string, EchoSetData>;

const echoSetsStore = createFsStore<EchoSetsJson>();

export const listEchoSets = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<EchoSetResponseItem>> => {
  const echoSets = await echoSetsStore.get('echo-set.json');
  if (!echoSets) {
    throw new Error('Failed to load echo sets data');
  }

  return Object.entries(echoSets).map(([id, group]) => ({
    id: Number.parseInt(id),
    name: group.en,
    tiers: group.tiers,
  }));
});
