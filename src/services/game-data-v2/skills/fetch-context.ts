import { EntityType } from '@/services/game-data/types';

import {
  echoSets,
  skillAttributes as skillAttributesRepository,
  weapons,
} from '../repostiory';
import type { EchoSet, SkillAttribute, Weapon } from '../repostiory';

export type EntitySkillContext = {
  attributesByLevelGroupId: Map<number, Array<SkillAttribute>>;
  weapon?: Weapon;
  echoSet?: EchoSet;
};

export async function fetchContextForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<EntitySkillContext> {
  const allAttributes = await skillAttributesRepository.list();
  const attributesByLevelGroupId = Map.groupBy(
    allAttributes,
    (attribute) => attribute.skillLevelGroupId,
  );

  return {
    attributesByLevelGroupId,
    weapon:
      entityType === EntityType.WEAPON ? await getRequiredWeapon(entityId) : undefined,
    echoSet:
      entityType === EntityType.ECHO_SET
        ? await getRequiredEchoSet(entityId)
        : undefined,
  };
}

async function getRequiredWeapon(entityId: number): Promise<Weapon> {
  const weapon = await weapons.get(entityId);
  if (!weapon) throw new Error('invalid id');
  return weapon;
}

async function getRequiredEchoSet(entityId: number): Promise<EchoSet> {
  const echoSet = await echoSets.get(entityId);
  if (!echoSet) throw new Error('invalid id');
  return echoSet;
}
