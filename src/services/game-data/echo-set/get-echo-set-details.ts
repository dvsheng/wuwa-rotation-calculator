import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { GetClientEntityDetailsOutput } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetClientEchoSetDetailsInputSchema } from './types';
import type { EchoSet } from './types';

const echoSetStore = createFsStore<EchoSet>();

export const getEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
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
  .handler(async ({ data }): Promise<GetClientEntityDetailsOutput> => {
    const { id, requirement } = data;
    const key = `echo-set/parsed/${id}.json`;
    const echoSet = await echoSetStore.get(key);
    if (!echoSet) {
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }

    const setEffect = echoSet.setEffects[requirement];

    return {
      attacks: (setEffect?.attacks || []).map((attack) =>
        toClientAttack(attack, echoSet.name, `${echoSet.name} Attack`),
      ),
      modifiers: (setEffect?.modifiers || []).map((modifier) =>
        toClientBuff(modifier, echoSet.name, 'echo-set', `${echoSet.name} Buff`),
      ),
    };
  });
