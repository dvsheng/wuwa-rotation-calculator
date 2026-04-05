import { EntityType } from '@/services/game-data/types';

import { damage, echoSkills, echoes } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

import { transformDamageToDamageInstances } from './transform-damage-to-damage-instance';
import type { DamageInstance } from './types';

export async function listEntityDamageInstancesHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<DamageInstance>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return listCharacterDamageInstances(entityId);
    }
    case EntityType.ECHO: {
      return listEchoDamageInstances(entityId);
    }
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

async function listCharacterDamageInstances(
  entityId: number,
): Promise<Array<DamageInstance>> {
  const entitySkills = await listEntitySkillsHandler(entityId, EntityType.CHARACTER);
  const damageIds = entitySkills.flatMap((skill) => skill.damageIds);
  return listDamageInstancesByIds(damageIds);
}

async function listEchoDamageInstances(
  entityId: number,
): Promise<Array<DamageInstance>> {
  const echo = await echoes.get(entityId);
  if (!echo) throw new Error('invalid id');

  const echoSkill = await echoSkills.get(echo.skillId);
  if (!echoSkill || echoSkill.settleIds.length === 0) {
    return [];
  }

  return listDamageInstancesByIds(echoSkill.settleIds);
}

async function listDamageInstancesByIds(
  damageIds: Array<number>,
): Promise<Array<DamageInstance>> {
  if (damageIds.length === 0) {
    return [];
  }

  const damageRows = await damage.getByIds(damageIds);
  if (damageRows.length === 0) {
    return [];
  }

  return transformDamageToDamageInstances(damageRows);
}
