import { createServerFn } from '@tanstack/react-start';

import { ListEntitiesRequestSchema } from '@/schemas/game-data-service';

import { listEntitiesHandler } from './list-entities.server';

export const listEntities = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntitiesRequestSchema)
  .handler(async ({ data }) => {
    return listEntitiesHandler(data);
  });
