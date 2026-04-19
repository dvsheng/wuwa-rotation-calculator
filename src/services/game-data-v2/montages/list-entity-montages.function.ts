import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntityMontagesHandler } from './list-entity-montages.server';

const ListEntityMontagesRequestSchema = z.object({
  id: z.number(),
});

export const listEntityMontages = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityMontagesRequestSchema)
  .handler(({ data }) => {
    return listEntityMontagesHandler(data.id);
  });
