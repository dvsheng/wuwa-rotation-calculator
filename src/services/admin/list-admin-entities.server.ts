import { asc } from 'drizzle-orm';

import { database } from '@/db/client';
import type { DatabaseEntity } from '@/db/schema';
import { entities } from '@/db/schema';

import type { RecursivelyReplaceNullWithUndefined } from '../game-data/database-type-adapters';
import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

type AdminListEntityRow = RecursivelyReplaceNullWithUndefined<DatabaseEntity>;

export const listAdminEntitiesHandler = async (): Promise<
  Array<AdminListEntityRow>
> => {
  const databaseEntities = await database
    .select({ entity: entities })
    .from(entities)
    .orderBy(asc(entities.name));

  return replaceNullsWithUndefined(databaseEntities.map((row) => row.entity));
};
