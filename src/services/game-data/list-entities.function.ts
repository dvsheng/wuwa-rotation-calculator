import { createServerFn } from '@tanstack/react-start';

import type { DatabaseEntity } from '@/db/schema';

import type { RecursivelyReplaceNullWithUndefined } from './database-type-adapters';
import { listEntitiesHandler } from './list-entities.server';

export type EntityListRow = RecursivelyReplaceNullWithUndefined<DatabaseEntity>;

export const listEntities = createServerFn({
  method: 'GET',
}).handler(async () => {
  return listEntitiesHandler();
});
