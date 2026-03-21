import { createServerFn } from '@tanstack/react-start';

import { AdminGetEntityDetailsRequestSchema } from '@/schemas/admin';

import { getEntityDetailsHandler } from './get-entity-details.server';

export const getEntityDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(AdminGetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return getEntityDetailsHandler(data);
  });
