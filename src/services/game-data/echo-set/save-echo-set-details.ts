import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import type { EchoSet } from './types';

const echoSetStore = createFsStore<EchoSet>();

export const saveEchoSetDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: echoSet }) => {
    console.log('Saving echo set:', echoSet.id, echoSet.name);
    const key = `echo-set/parsed/${echoSet.id}.json`;

    await echoSetStore.put(key, echoSet);
    console.log('Successfully saved echo set:', echoSet.id);
    return { success: true };
  });
