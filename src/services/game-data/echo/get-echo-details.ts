import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { DamageType } from '@/types';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import type { Echo, GetClientEchoDetailsOutput, StoreEcho } from './types';

const echoStore = createFsStore<StoreEcho>();

/**
 * Shared handler for fetching echo details.
 */
export const getEchoDetailsHandler = async (id: string): Promise<StoreEcho> => {
  const key = `echo/parsed/${id}.json`;

  const echoData = await echoStore.get(key);
  if (!echoData) {
    throw new Error(`Failed to fetch echo details for ID ${id}`);
  }
  echoData.capabilities.attacks = echoData.capabilities.attacks.map((attack) => ({
    ...attack,
    tags: [...attack.tags, DamageType.ECHO],
  }));

  return echoData;
};

export const getEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<Echo> => {
    return getEchoDetailsHandler(id);
  });

export const getClientEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<GetClientEchoDetailsOutput> => {
    const echo = await getEchoDetailsHandler(id);
    return {
      attacks: echo.capabilities.attacks.map((attack) =>
        toClientAttack(attack, echo.name, `${echo.name} Attack`),
      ),
      modifiers: echo.capabilities.modifiers.map((modifier) =>
        toClientBuff(modifier, echo.name, `${echo.name} Buff`),
      ),
    };
  });
