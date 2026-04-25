import type { EntityType } from '@/services/game-data/types';

import { damage as damageRepository } from '../repostiory';
import type { Damage } from '../repostiory';

import { fetchResourcesForEntity } from './fetch-resources';

export type DamageInstanceContext = {
  damageById: Map<number, Damage>;
};

export async function fetchContextForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<DamageInstanceContext> {
  const primaryRows = await fetchResourcesForEntity(entityId, entityType);
  const referencedIds = primaryRows.flatMap((row) =>
    parseConditionDamageIds(row.condition),
  );

  if (referencedIds.length === 0) {
    return { damageById: new Map() };
  }

  const referencedRows = await damageRepository.getByIds(referencedIds);
  const damageById = new Map(referencedRows.map((row) => [row.id, row]));
  return { damageById };
}

function parseConditionDamageIds(condition: string): Array<number> {
  const matches = [...condition.matchAll(/ExecDamage (\d+)/g)];
  return matches.map((match) => Number.parseInt(match[1], 10));
}
