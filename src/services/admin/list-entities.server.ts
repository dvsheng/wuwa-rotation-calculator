import { asc } from 'drizzle-orm';

import { database } from '@/db/client';
import type { DatabaseEntity } from '@/db/schema';
import { entities } from '@/db/schema';

import type { RecursivelyReplaceNullWithUndefined } from '../game-data/database-type-adapters';
import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

type EntityListRow = RecursivelyReplaceNullWithUndefined<DatabaseEntity>;

export const listEntitiesHandler = async (): Promise<Array<EntityListRow>> => {
  const databaseEntities = await database
    .select({ entity: entities })
    .from(entities)
    .orderBy(asc(entities.name));

  return replaceNullsWithUndefined(databaseEntities.map((row) => row.entity));
};
