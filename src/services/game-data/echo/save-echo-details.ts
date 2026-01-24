import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import type { Echo } from './types';

const echoStore = createFsStore<Echo>();

export const saveEchoDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: echo }) => {
    console.log('Saving echo:', echo.id, echo.name);
    const key = `echo/parsed/${echo.id}.json`;

    await echoStore.put(key, echo);
    console.log('Successfully saved echo:', echo.id);
    return { success: true };
  });
