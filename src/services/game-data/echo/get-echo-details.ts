import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import { getEchoIdByName } from './list-echoes';
import type { Echo, GetClientEchoDetailsOutput } from './types';

const echoStore = createFsStore<Echo>();

export const getEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getEchoIdByName(name);
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
  .handler(async ({ data: id }): Promise<GetClientEchoDetailsOutput> => {
    const key = `echo/parsed/${id}.json`;
    const echo = await echoStore.get(key);
    if (!echo) {
      throw new Error(`Failed to fetch echo details for ID ${id}`);
    }

    return {
      attack: echo.attack
        ? toClientAttack(echo.attack, echo.name, 'Echo Attack')
        : undefined,
      modifiers: echo.modifiers.map((modifier) =>
        toClientBuff(modifier, echo.name, 'echo', `${echo.name} Buff`),
      ),
    };
  });
