import { createServerFn } from '@tanstack/react-start';

import { listAdminEntitiesHandler } from './list-admin-entities.server';

export const listAdminEntities = createServerFn({
  method: 'GET',
}).handler(async () => {
  return listAdminEntitiesHandler();
});
