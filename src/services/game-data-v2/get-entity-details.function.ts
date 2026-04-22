import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getEntityDetailsHandler } from './get-entity-details.server';

const GetEntityDetailsRequestSchema = z.object({
  id: z.number(),
});

export const getEntityDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetEntityDetailsRequestSchema)
  .handler(({ data }) => {
    return getEntityDetailsHandler(data.id);
  });
