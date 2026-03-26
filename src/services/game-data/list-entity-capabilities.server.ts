import { eq } from 'drizzle-orm';
import { memoize } from 'es-toolkit/function';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { ListEntityCapabilitiesRequest } from '@/schemas/game-data-service';

import { replaceNullsWithUndefined } from './database-type-adapters';
import { CapabilityType } from './types';
import type { Capability } from './types';

/**
 * Shared handler for fetching stored capability details from the database.
 */
const baseListEntityCapabilitiesHandler = async ({
  id,
}: ListEntityCapabilitiesRequest): Promise<Array<Capability>> => {
  // Query entity with all capabilities
  const databaseEntity = await database.query.entities.findFirst({
    where: eq(entities.id, id),
    with: {
      skills: {
        with: {
          capabilities: true,
        },
      },
    },
  });
  if (!databaseEntity) throw new Error(`Entity not found for ID ${id}`);

  const entity = replaceNullsWithUndefined(databaseEntity);
  const capabilities = entity.skills.flatMap((skill) =>
    skill.capabilities.map(({ createdAt, updatedAt, ...capability }) => {
      const base = {
        id: capability.id,
        name: capability.name ?? '',
        description: capability.description,
        parentName: skill.name,
        iconUrl: skill.iconUrl ?? entity.iconUrl,
        originType: skill.originType,
        skillId: capability.skillId,
        entityId: skill.entityId,
        skillDescription: skill.description,
      };
      // Lifts our discriminated union up
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
  return capabilities;
};

export const listEntityCapabilitiesHandler = memoize(
  baseListEntityCapabilitiesHandler,
  {
    getCacheKey: (
      parameters: Parameters<typeof baseListEntityCapabilitiesHandler>[0],
    ) => JSON.stringify(parameters),
  },
);
