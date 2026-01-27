import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { GetClientEntityDetailsOutput } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import type { Echo } from './types';

const echoStore = createFsStore<Echo>();

export const getEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const key = `echo/parsed/${id}.json`;

    const echoData = await echoStore.get(key);
    if (!echoData) {
      throw new Error(`Failed to fetch echo details for ID ${id}`);
    }

    return echoData;
  });

export const getClientEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<GetClientEntityDetailsOutput> => {
    const key = `echo/parsed/${id}.json`;
    const echo = await echoStore.get(key);
    if (!echo) {
      throw new Error(`Failed to fetch echo details for ID ${id}`);
    }

    return {
      attacks: echo.capabilities.attacks.map((attack) =>
        toClientAttack(attack, echo.name, `${echo.name} Attack`),
      ),
      modifiers: echo.capabilities.modifiers.map((modifier) =>
        toClientBuff(modifier, echo.name, 'echo', `${echo.name} Buff`),
      ),
    };
  });
