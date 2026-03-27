import { inArray } from 'drizzle-orm';
import { memoize } from 'es-toolkit/function';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { ListSkillsRequest } from '@/schemas/game-data-service';

import { replaceNullsWithUndefined } from './database-type-adapters';
import type { Skill } from './types';

const baseListSkillsHandler = async ({
  entityIds,
}: ListSkillsRequest): Promise<Array<Skill>> => {
  const uniqueEntityIds = [...new Set(entityIds)];
  const databaseEntities = await database.query.entities.findMany({
    where: inArray(entities.id, uniqueEntityIds),
    with: {
      skills: true,
    },
  });
  const entitiesById = new Map(databaseEntities.map((entity) => [entity.id, entity]));
  const missingEntityIds = uniqueEntityIds.filter((id) => !entitiesById.has(id));

  if (missingEntityIds.length > 0) {
    throw new Error(
      `Entity not found for ID${missingEntityIds.length === 1 ? '' : 's'} ${missingEntityIds.join(', ')}`,
    );
  }

  return uniqueEntityIds.flatMap((id) => {
    const entity = replaceNullsWithUndefined(entitiesById.get(id)!);

    return entity.skills.map(({ createdAt, updatedAt, ...skill }) => skill);
  });
};

export const listSkillsHandler = memoize(baseListSkillsHandler, {
  getCacheKey: (parameters: Parameters<typeof baseListSkillsHandler>[0]) =>
    JSON.stringify(parameters),
});
