import { EntityType } from '../game-data/types';

import { listEntityActivatableSkillsHandler } from './activatable-skills/list-entity-activatable-skills.server';
import { getEntityBuffsHandler } from './buffs/list-entity-buffs.server';
import { listEntityBulletsHandler } from './bullets/list-entity-bullets.server';
import { listEntityDamageInstancesHandler } from './damage-instances/list-entity-damage-instances.server';
import { listEntityModifiersHandler } from './modifiers/list-entity-modifiers.server';
import { listEntityMontagesHandler } from './montages/list-entity-montages.server';
import { listEntitySkillsHandler } from './skills/list-entity-skills.server';

export interface EntityDetails {
  id: number;
  entityType: EntityType;
  activatableSkills: Awaited<ReturnType<typeof listEntityActivatableSkillsHandler>>;
  buffs: Awaited<ReturnType<typeof getEntityBuffsHandler>>;
  bullets: Awaited<ReturnType<typeof listEntityBulletsHandler>>;
  damageInstances: Awaited<ReturnType<typeof listEntityDamageInstancesHandler>>;
  modifiers: Awaited<ReturnType<typeof listEntityModifiersHandler>>;
  montages: Awaited<ReturnType<typeof listEntityMontagesHandler>>;
  skills: Awaited<ReturnType<typeof listEntitySkillsHandler>>;
}

export const getEntityDetailsHandler = async (
  entityId: number,
): Promise<EntityDetails> => {
  const entityType = inferEntityType(entityId);
  const [
    activatableSkills,
    buffs,
    bullets,
    damageInstances,
    modifiers,
    montages,
    skills,
  ] = await Promise.all([
    listEntityActivatableSkillsHandler(entityId),
    getEntityBuffsHandler(entityId),
    listEntityBulletsHandler(entityId),
    listEntityDamageInstancesHandler(entityId),
    listEntityModifiersHandler(entityId),
    listEntityMontagesHandler(entityId),
    listEntitySkillsHandler(entityId),
  ]);

  return {
    id: entityId,
    entityType,
    activatableSkills,
    buffs,
    bullets,
    damageInstances,
    modifiers,
    montages,
    skills,
  };
};

const inferEntityType = (entityId: number): EntityType => {
  const id = String(entityId);

  if (id.length <= 2) return EntityType.ECHO_SET;
  if (id.length === 8 && id[0] === '2') return EntityType.WEAPON;
  if (id.length === 4) return EntityType.CHARACTER;
  return EntityType.ECHO;
};
