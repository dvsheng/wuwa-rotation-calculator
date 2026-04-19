import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { listEntityModifiersHandler } from './list-entity-modifiers.server';

const ListEntityModifiersRequestSchema = z.object({
  id: z.number(),
});

export const listEntityModifiers = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityModifiersRequestSchema)
  .handler(({ data }) => {
    return listEntityModifiersHandler(data.id);
  });
