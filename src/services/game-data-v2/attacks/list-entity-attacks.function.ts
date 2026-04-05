import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntityAttacksHandler } from './list-entity-attacks.server';

const ListEntityAttacksRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntityAttacks = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityAttacksRequestSchema)
  .handler(({ data }) => {
    return listEntityAttacksHandler(data.id, data.entityType);
  });
