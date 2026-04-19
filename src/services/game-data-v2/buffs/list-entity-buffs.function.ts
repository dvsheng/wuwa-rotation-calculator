import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getEntityBuffsHandler } from './list-entity-buffs.server';

const GetEntityBuffsRequestSchema = z.object({
  id: z.number(),
});

export const getEntityBuffs = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityBuffsRequestSchema)
  .handler(({ data }) => {
    return getEntityBuffsHandler(data.id);
  });
