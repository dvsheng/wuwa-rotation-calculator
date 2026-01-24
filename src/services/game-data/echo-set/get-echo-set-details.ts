import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import { getEchoSetIdByName } from './list-echo-sets';
import type { EchoSet } from './types';

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
