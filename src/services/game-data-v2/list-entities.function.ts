import { createServerFn } from '@tanstack/react-start';

import { listEntitiesHandler } from './list-entities';

export const listEntities = createServerFn({
  method: 'GET',
}).handler(async () => {
  return listEntitiesHandler();
});
