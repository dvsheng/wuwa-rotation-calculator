import { inArray } from 'drizzle-orm';

import { database } from '@/db/client';
import { attacks, entities, modifiers } from '@/db/schema';
import type { GetIconsRequest, IconRequestType } from '@/schemas/game-data-service';

const HAKUSHIN_BASE_URL = 'https://api.hakush.in/ww';

/**
 * Strips the /Game/Aki/ prefix from icon paths, replaces the extension with .webp,
 * and returns the full Hakushin API URL.
 */
const processIconPath = (iconPath?: string | null): string | undefined => {
  if (!iconPath) return undefined;

  // Strip /Game/Aki/ prefix
  let processed = iconPath.replace(/^\/Game\/Aki\//i, '/');

  // Remove everything after and including the last dot, then add .webp
  processed = processed.replace(/\.[^.]*$/, '.webp');

  return `${HAKUSHIN_BASE_URL}${processed}`;
};

/**
 * Creates a composite key from type and id for unique identification across tables.
 */
const getIconKey = (type: IconRequestType, id: number): string => `${type}:${id}`;

/**
 * Get icon URLs for multiple items by their IDs and types.
 * Supports attacks, modifiers, and entities.
 * For capabilities without icons, falls back to the parent entity's icon.
 * Returns an array with iconUrl appended to each request.
 */
export const getIconsHandler = async (requests: GetIconsRequest) => {
  // Group requests by type
  const attackIds = requests.filter((r) => r.type === 'attack').map((r) => r.id);
  const modifierIds = requests.filter((r) => r.type === 'modifier').map((r) => r.id);
  const entityIds = requests.filter((r) => r.type === 'entity').map((r) => r.id);

  // Query all tables in parallel, fetching entityId for capabilities
  // Note: For entities, the ID is the hakushinId (game ID), not the database ID
  const [attackResults, modifierResults, entityResults] = await Promise.all([
    attackIds.length > 0
      ? database.query.attacks.findMany({
          where: inArray(attacks.id, attackIds),
          columns: { id: true, iconPath: true, entityId: true },
        })
      : [],
    modifierIds.length > 0
      ? database.query.modifiers.findMany({
          where: inArray(modifiers.id, modifierIds),
          columns: { id: true, iconPath: true, entityId: true },
        })
      : [],
    entityIds.length > 0
      ? database.query.entities.findMany({
          where: inArray(entities.hakushinId, entityIds),
          columns: { hakushinId: true, iconPath: true },
        })
      : [],
  ]);

  // Collect entity IDs for capabilities that don't have icons (for fallback)
  const fallbackEntityIds = new Set<number>();
  const capabilityToEntityMap = new Map<string, number>();

  for (const attack of attackResults) {
    if (!attack.iconPath) {
      fallbackEntityIds.add(attack.entityId);
      capabilityToEntityMap.set(getIconKey('attack', attack.id), attack.entityId);
    }
  }

  for (const modifier of modifierResults) {
    if (!modifier.iconPath) {
      fallbackEntityIds.add(modifier.entityId);
      capabilityToEntityMap.set(getIconKey('modifier', modifier.id), modifier.entityId);
    }
  }

  // Fetch parent entities for capabilities without icons
  const fallbackEntities =
    fallbackEntityIds.size > 0
      ? await database.query.entities.findMany({
          where: inArray(entities.id, [...fallbackEntityIds]),
          columns: { id: true, iconPath: true },
        })
      : [];

  // Create entity icon map by database ID for fallback lookups
  const entityIconByIdMap = new Map<number, string | undefined>();
  for (const entity of fallbackEntities) {
    entityIconByIdMap.set(entity.id, processIconPath(entity.iconPath));
  }

  // Create a map using composite keys (type:id) to handle non-unique IDs across tables
  const iconPathMap = new Map<string, string | undefined>();

  for (const item of attackResults) {
    const key = getIconKey('attack', item.id);
    const icon = processIconPath(item.iconPath);
    // Use capability icon, or fall back to entity icon
    iconPathMap.set(key, icon ?? entityIconByIdMap.get(item.entityId));
  }

  for (const item of modifierResults) {
    const key = getIconKey('modifier', item.id);
    const icon = processIconPath(item.iconPath);
    // Use capability icon, or fall back to entity icon
    iconPathMap.set(key, icon ?? entityIconByIdMap.get(item.entityId));
  }

  for (const item of entityResults) {
    if (item.hakushinId) {
      iconPathMap.set(
        getIconKey('entity', item.hakushinId),
        processIconPath(item.iconPath),
      );
    }
  }

  // Map requests to responses with iconUrl appended
  return requests.map((request) => ({
    ...request,
    iconUrl: iconPathMap.get(getIconKey(request.type, request.id)),
  }));
};
