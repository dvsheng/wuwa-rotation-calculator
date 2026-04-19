import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntityDamageInstancesHandler } from './list-entity-damage-instances.server';

const ListEntityDamageInstancesRequestSchema = z.object({
  id: z.number(),
});

export const listEntityDamageInstances = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityDamageInstancesRequestSchema)
  .handler(({ data }) => {
    return listEntityDamageInstancesHandler(data.id);
  });
