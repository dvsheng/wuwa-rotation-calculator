import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import { getEchoSetIdByName } from './list-echo-sets';
import { GetClientEchoSetDetailsInputSchema } from './types';
import type { EchoSet, GetClientEchoSetDetailsOutput } from './types';

const echoSetStore = createFsStore<EchoSet>();

export const getEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getEchoSetIdByName(name);
    const key = `echo-set/parsed/${id}.json`;

    const echoSetData = await echoSetStore.get(key);
    if (!echoSetData) {
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }

    return echoSetData;
  });

export const getClientEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetClientEchoSetDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientEchoSetDetailsOutput> => {
    const { id, requirement } = data;
    const key = `echo-set/parsed/${id}.json`;
    const echoSet = await echoSetStore.get(key);
    if (!echoSet) {
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }

    const setEffect = echoSet.setEffects[requirement];

    return {
      modifiers: (setEffect?.modifiers || []).map((modifier) =>
        toClientBuff(modifier, echoSet.name, 'echo-set', `${echoSet.name} Buff`),
      ),
    };
  });
