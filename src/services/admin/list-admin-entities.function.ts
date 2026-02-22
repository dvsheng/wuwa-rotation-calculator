import { createServerFn } from '@tanstack/react-start';

import { AdminListEntitiesRequestSchema } from '@/schemas/admin';

import { listAdminEntitiesHandler } from './list-admin-entities.server';

export const listAdminEntities = createServerFn({
  method: 'GET',
})
  .inputValidator(AdminListEntitiesRequestSchema)
  .handler(async ({ data }) => {
    return listAdminEntitiesHandler(data);
  });
