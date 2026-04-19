import { EntityType } from '@/services/game-data/types';

import { skillInfoRows } from '../repostiory';
import type { SkillInfoRow } from '../repostiory';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<SkillInfoRow>> {
  if (entityType !== EntityType.CHARACTER) return [];
  const all = await skillInfoRows.list();
  return all.filter(
    (row) =>
      String(row.skillId).startsWith(String(entityId)) &&
      String(row.skillId).length >= 7,
  );
}
