import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntityBulletsHandler } from './list-entity-bullets.server';

const ListEntityBulletsRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntityBullets = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityBulletsRequestSchema)
  .handler(({ data }) => {
    return listEntityBulletsHandler(data.id, data.entityType);
  });
