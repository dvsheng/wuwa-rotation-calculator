import { asc } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities } from '@/db/schema';

import { replaceNullsWithUndefined } from './database-type-adapters';
import type { EntityListRow } from './list-entities.function';

export const listEntitiesHandler = async (): Promise<Array<EntityListRow>> => {
  const databaseEntities = await database
    .select({ entity: entities })
    .from(entities)
    .orderBy(asc(entities.name));

  return replaceNullsWithUndefined(databaseEntities.map((row) => row.entity));
};
