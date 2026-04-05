import { inArray } from 'drizzle-orm';
import { memoize } from 'es-toolkit/function';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { ListCapabilitiesRequest } from '@/schemas/game-data-service';

import { replaceNullsWithUndefined } from './database-type-adapters';
import { CapabilityType } from './types';
import type { Capability } from './types';

/**
 * Shared handler for fetching stored capability details from the database.
 */
const baseListCapabilitiesHandler = async ({
  entityIds,
}: ListCapabilitiesRequest): Promise<Array<Capability>> => {
  const uniqueEntityIds = [...new Set(entityIds)];
  const databaseEntities = await database.query.entities.findMany({
    where: inArray(entities.id, uniqueEntityIds),
    with: {
      skills: {
        with: {
          capabilities: true,
        },
      },
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

    return entity.skills.flatMap((skill) =>
      skill.capabilities.map(({ createdAt, updatedAt, ...capability }) => {
        const base = {
          id: capability.id,
          name: capability.name ?? skill.name,
          description: capability.description,
          parentName: skill.name,
          iconUrl: skill.iconUrl ?? entity.iconUrl,
          originType: skill.originType,
          skillId: capability.skillId,
          entityId: skill.entityId,
          skillDescription: skill.description,
        };

        switch (capability.capabilityJson.type) {
          case CapabilityType.ATTACK: {
            return { ...base, capabilityJson: capability.capabilityJson };
          }
          case CapabilityType.MODIFIER: {
            return { ...base, capabilityJson: capability.capabilityJson };
          }
          case CapabilityType.PERMANENT_STAT: {
            return { ...base, capabilityJson: capability.capabilityJson };
          }
        }
      }),
    );
  });
};

export const listCapabilitiesHandler = memoize(baseListCapabilitiesHandler, {
  getCacheKey: (parameters: Parameters<typeof baseListCapabilitiesHandler>[0]) =>
    JSON.stringify(parameters),
});
