import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntityMontagesHandler } from './list-entity-montages.server';

const ListEntityMontagesRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntityMontages = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityMontagesRequestSchema)
  .handler(({ data }) => {
    return listEntityMontagesHandler(data.id, data.entityType);
  });
