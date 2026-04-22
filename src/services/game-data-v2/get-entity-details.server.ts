import { EntityType } from '../game-data/types';

import { listEntityActivatableSkills } from './activatable-skills/list-entity-activatable-skills';
import { getEntityBuffs } from './buffs/list-entity-buffs';
import { listEntityBullets } from './bullets/list-entity-bullets';
import { listEntityDamageInstances } from './damage-instances/list-entity-damage-instances';
import { listEntityModifiers } from './modifiers/list-entity-modifiers';
import { listEntityMontages } from './montages/list-entity-montages';
import { listEntitySkills } from './skills/list-entity-skills';

export interface EntityDetails {
  id: number;
  entityType: EntityType;
  activatableSkills: Awaited<ReturnType<typeof listEntityActivatableSkills>>;
  buffs: Awaited<ReturnType<typeof getEntityBuffs>>;
  bullets: Awaited<ReturnType<typeof listEntityBullets>>;
  damageInstances: Awaited<ReturnType<typeof listEntityDamageInstances>>;
  modifiers: Awaited<ReturnType<typeof listEntityModifiers>>;
  montages: Awaited<ReturnType<typeof listEntityMontages>>;
  skills: Awaited<ReturnType<typeof listEntitySkills>>;
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
    listEntityActivatableSkills(entityId),
    getEntityBuffs(entityId),
    listEntityBullets(entityId),
    listEntityDamageInstances(entityId),
    listEntityModifiers(entityId),
    listEntityMontages(entityId),
    listEntitySkills(entityId),
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
