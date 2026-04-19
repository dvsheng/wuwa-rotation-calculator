import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntityBulletsHandler } from './list-entity-bullets.server';

const ListEntityBulletsRequestSchema = z.object({
  id: z.number(),
});

export const listEntityBullets = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityBulletsRequestSchema)
  .handler(({ data }) => {
    return listEntityBulletsHandler(data.id);
  });
