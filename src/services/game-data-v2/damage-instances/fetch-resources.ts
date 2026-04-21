import { EntityType } from '@/services/game-data/types';

import { damage, echoSkills, echoes } from '../repostiory';
import type { Damage } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<Damage>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const entitySkills = await listEntitySkillsHandler(entityId);
      return listDamageRowsByIds(entitySkills.flatMap((skill) => skill.damageIds));
    }
    case EntityType.ECHO: {
      const echo = await echoes.get(entityId);
      if (!echo) throw new Error('invalid id');

      const echoSkill = await echoSkills.get(echo.skillId);
      if (!echoSkill || echoSkill.settleIds.length === 0) {
        return [];
      }

      const rows = await listDamageRowsByIds(echoSkill.settleIds);
      console.log('hello world', rows.length, echoSkill.settleIds.length);
      return rows;
    }
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

async function listDamageRowsByIds(damageIds: Array<number>): Promise<Array<Damage>> {
  if (damageIds.length === 0) {
    return [];
  }
  return damage.getByIds(damageIds);
}
