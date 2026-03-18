import { asc, eq, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import type { DatabaseEntity } from '@/db/schema';
import { entities, skills } from '@/db/schema';

import type { RecursivelyReplaceNullWithUndefined } from '../game-data/database-type-adapters';
import { replaceNullsWithUndefined } from '../game-data/database-type-adapters';

type AdminListEntityRow = RecursivelyReplaceNullWithUndefined<
  DatabaseEntity & { skillCount: number }
>;

export const listAdminEntitiesHandler = async (): Promise<
  Array<AdminListEntityRow>
> => {
  const databaseEntities = await database
    .select({
      entity: entities,
      skillCount: sql<number | null>`count(${skills.id})`,
    })
    .from(entities)
    .leftJoin(skills, eq(skills.entityId, entities.id))
    .groupBy(entities.id)
    .orderBy(asc(entities.name));

  return replaceNullsWithUndefined(
    databaseEntities.map((row) => ({
      ...row.entity,
      skillCount: row.skillCount ?? 0,
    })),
  );
};
