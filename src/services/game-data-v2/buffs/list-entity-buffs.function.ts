import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { getEntityBuffsHandler } from './list-entity-buffs.server';

const GetEntityBuffsRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const getEntityBuffs = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityBuffsRequestSchema)
  .handler(({ data }) => {
    return getEntityBuffsHandler(data.id, data.entityType);
  });
