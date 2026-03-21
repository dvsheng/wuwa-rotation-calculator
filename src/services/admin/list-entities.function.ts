import { createServerFn } from '@tanstack/react-start';

import { listEntitiesHandler } from './list-entities.server';

export const listEntities = createServerFn({
  method: 'GET',
}).handler(async () => {
  return listEntitiesHandler();
});
