import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import { getEchoIdByName } from './list-echoes';
import type { Echo } from './types';

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
