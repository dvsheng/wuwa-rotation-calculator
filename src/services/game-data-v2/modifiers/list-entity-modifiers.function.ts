import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { EntityType } from '@/services/game-data/types';

import { listEntityModifiersHandler } from './list-entity-modifiers.server';

const ListEntityModifiersRequestSchema = z.object({
  id: z.number(),
  entityType: z.enum(EntityType),
});

export const listEntityModifiers = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityModifiersRequestSchema)
  .handler(({ data }) => {
    return listEntityModifiersHandler(data.id, data.entityType);
  });
