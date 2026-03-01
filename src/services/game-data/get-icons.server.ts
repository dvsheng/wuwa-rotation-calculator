import { inArray, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities, fullCapabilities } from '@/db/schema';
import type { GetIconsRequest } from '@/schemas/game-data-service';

import type { GetIconsResponse } from './get-icons.types';

/**
 * Get icon URLs for multiple items by their IDs and types.
 * Supports attacks, modifiers, and entities.
 * For capabilities without icons, falls back to the parent entity's icon.
 * Returns an array with iconUrl appended to each request.
 */
export const getIconsHandler = async (
  requests: GetIconsRequest,
): Promise<GetIconsResponse> => {
  // Group requests by type
  const capabilityIds = requests
    .filter((r) => r.type === 'capability')
    .map((r) => r.id);
  const entityIds = requests.filter((r) => r.type === 'entity').map((r) => r.id);

  // Query all tables in parallel, fetching entityId for capabilities
  // Note: For entities, the ID is the gameId (game ID), not the database ID
  const [capabilityResults, entityResults] = await Promise.all([
    capabilityIds.length > 0
      ? database
          .select({
            id: fullCapabilities.capabilityId,
            iconUrl: sql<
              string | null
            >`coalesce(${fullCapabilities.skillIconUrl}, ${fullCapabilities.entityIconUrl})`.as(
              'iconUrl',
            ),
          })
          .from(fullCapabilities)
          .where(inArray(fullCapabilities.capabilityId, capabilityIds))
      : [],
    entityIds.length > 0
      ? database
          .select({
            id: entities.id,
            iconUrl: entities.iconUrl,
          })
          .from(entities)
          .where(inArray(entities.id, entityIds))
      : [],
  ]);

  // Map requests to responses with iconUrl appended
  return requests.map((request) => {
    const result =
      request.type === 'capability'
        ? capabilityResults.find((r) => r.id === request.id)
        : entityResults.find((r) => r.id === request.id);

    return {
      ...request,
      iconUrl: result?.iconUrl ?? undefined,
    };
  });
};
