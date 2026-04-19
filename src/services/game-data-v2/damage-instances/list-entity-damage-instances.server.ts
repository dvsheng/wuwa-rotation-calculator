import { EntityType } from '@/services/game-data/types';

import { createEntityResourceLister } from '../create-entity-resource-lister';
import { damage, echoSkills, echoes } from '../repostiory';
import type { Damage } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

import { tryTransformToDamageInstance } from './transform-damage-to-damage-instance';

export const listEntityDamageInstancesHandler = createEntityResourceLister({
  fetchResourcesForEntity: fetchDamageRowsForEntity,
  transform: tryTransformToDamageInstance,
});

async function fetchDamageRowsForEntity(
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

      return listDamageRowsByIds(echoSkill.settleIds);
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
