import { EntityType } from '@/services/game-data/types';

import { echoes, skillInfoRows } from '../repostiory';
import type { SkillInfoRow } from '../repostiory';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<SkillInfoRow>> {
  const all = await skillInfoRows.list();

  switch (entityType) {
    case EntityType.CHARACTER: {
      return all.filter(
        (row) =>
          String(row.skillId).startsWith(String(entityId)) &&
          String(row.skillId).length >= 7,
      );
    }
    case EntityType.ECHO: {
      const echo = await echoes.get(entityId);
      if (!echo) throw new Error('invalid id');

      const skillIdPrefix = String(echo.skillId).slice(0, 6);
      return all.filter((row) => String(row.skillId).startsWith(skillIdPrefix));
    }
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}
