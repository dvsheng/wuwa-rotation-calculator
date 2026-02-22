import { createServerFn } from '@tanstack/react-start';

import { AdminGetEntityDetailsRequestSchema } from '@/schemas/admin';

import { getAdminEntityDetailsHandler } from './get-admin-entity-details.server';

export const getAdminEntityDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(AdminGetEntityDetailsRequestSchema)
  .handler(async ({ data }) => {
    return getAdminEntityDetailsHandler(data);
  });
