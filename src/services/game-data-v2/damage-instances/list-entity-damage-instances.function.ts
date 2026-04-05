import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntityDamageInstancesHandler } from './list-entity-damage-instances.server';

const ListEntityDamageInstancesRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntityDamageInstances = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityDamageInstancesRequestSchema)
  .handler(({ data }) => {
    return listEntityDamageInstancesHandler(data.id, data.entityType);
  });
