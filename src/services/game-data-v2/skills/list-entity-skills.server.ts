import { EntityType, OriginType, Sequence } from '@/services/game-data/types';

import { createEntityResourceLister } from '../create-entity-resource-lister';
import type { EntityResource } from '../create-entity-resource-lister';
import type {
  EchoSet,
  EchoSetEffect,
  ResonatorChain,
  ResonatorSkill,
  SkillAttribute,
  Weapon,
  WeaponEffect,
} from '../repostiory';
import {
  echoSetEffects,
  echoSets,
  resonatorChains,
  resonatorSkills,
  skillAttributes as skillAttributesRepository,
  weaponEffects,
  weapons,
} from '../repostiory';

import {
  CHAIN_TO_SEQUENCE_MAP,
  mapSkillTypeToOriginType,
} from './map-skill-type-to-origin-type';
import type { EntitySkillData, EntitySkillRepositoryRow } from './types';

export const listEntitySkillsHandler: (
  entityId: number,
  entityType: EntityType,
) => Promise<Array<EntityResource<EntitySkillData, EntitySkillRepositoryRow>>> =
  createEntityResourceLister({
    fetchResourcesForEntity,
    fetchContextForEntity,
    transform,
    filter: () => true,
  });

type EntitySkillContext = {
  attributesByLevelGroupId: Map<number, Array<SkillAttribute>>;
  weapon?: Weapon;
  echoSet?: EchoSet;
};

async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<EntitySkillRepositoryRow>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const [allSkills, allChains] = await Promise.all([
        resonatorSkills.list(),
        resonatorChains.list(),
      ]);

      return [
        ...allSkills.filter((s) => s.skillGroupId === entityId && s.skillType !== 7),
        ...allChains.filter((c) => c.groupId === entityId),
      ];
    }
    case EntityType.WEAPON: {
      const weapon = await weapons.get(entityId);
      if (!weapon) throw new Error('invalid id');

      const allEffects = await weaponEffects.list();
      const resonEffects = allEffects.filter(
        (effect) => effect.resonId === weapon.resonId,
      );
      if (resonEffects.length === 0) return [];

      const seen = new Set<number>();
      return resonEffects
        .toSorted((a, b) => a.id - b.id)
        .filter((effect) => {
          if (seen.has(effect.resonId)) return false;
          seen.add(effect.resonId);
          return true;
        });
    }
    case EntityType.ECHO_SET: {
      const echoSet = await echoSets.get(entityId);
      if (!echoSet) throw new Error('invalid id');

      const fetterMap = echoSet.fetterMap as Array<{ Key: number; Value: number }>;
      const fetterIds = new Set(fetterMap.map((entry) => entry.Value));

      const allEffects = await echoSetEffects.list();
      return allEffects.filter((f) => fetterIds.has(f.id));
    }
    case EntityType.ECHO: {
      return [];
    }
  }
}

async function fetchContextForEntity(
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

function transform(
  row: EntitySkillRepositoryRow,
  context: EntitySkillContext,
): EntitySkillData {
  if (isResonatorSkill(row)) return transformResonatorSkill(row, context);
  if (isResonatorChain(row)) return transformResonatorChain(row);
  if (isWeaponEffect(row)) return transformWeaponEffect(row, context);
  return transformEchoSetEffect(row);
}

function transformResonatorSkill(
  skill: ResonatorSkill,
  context: EntitySkillContext,
): EntitySkillData {
  const rawDescriptionParameters =
    skill.multiSkillDetailNum.length > 0
      ? skill.multiSkillDetailNum
      : skill.skillDetailNum;
  const descriptionParameters = resolveSkillDescriptionParameters(
    rawDescriptionParameters,
  );

  return {
    gameId: skill.id,
    name: skill.skillName,
    description: substituteParameters(skill.skillDescribe, descriptionParameters),
    descriptionParameters,
    iconUrl: skill.icon,
    originType: mapSkillTypeToOriginType(skill.skillType),
    damageIds: skill.damageList ?? [],
    buffIds: skill.buffList,
    skillAttributes:
      context.attributesByLevelGroupId.get(skill.skillLevelGroupId) ?? [],
  };
}

function transformResonatorChain(chain: ResonatorChain): EntitySkillData {
  return {
    gameId: chain.id,
    name: chain.nodeName,
    description: substituteParameters(
      chain.attributesDescription,
      chain.attributesDescriptionParams ?? undefined,
    ),
    descriptionParameters: resolveSkillDescriptionParameters(
      chain.attributesDescriptionParams ?? undefined,
    ),
    iconUrl: chain.nodeIcon,
    originType: CHAIN_TO_SEQUENCE_MAP[chain.groupIndex] ?? Sequence.S6,
    damageIds: [],
    buffIds: chain.buffIds ?? [],
  };
}

function transformWeaponEffect(
  effect: WeaponEffect,
  context: EntitySkillContext,
): EntitySkillData {
  const weapon = context.weapon;
  if (!weapon) throw new Error('missing weapon context');

  return {
    gameId: effect.resonId,
    name: effect.name,
    description: weapon.desc,
    originType: OriginType.WEAPON,
    iconUrl: weapon.iconSmall,
    damageIds: [],
    buffIds: effect.effect,
  };
}

function transformEchoSetEffect(effect: EchoSetEffect): EntitySkillData {
  return {
    gameId: effect.id,
    name: effect.name,
    description: effect.effectDescription,
    originType: OriginType.ECHO_SET,
    iconUrl: effect.fetterIcon,
    damageIds: [],
    buffIds: effect.buffIds,
  };
}

function substituteParameters(template: string, values?: Array<string>): string {
  return values
    ? values.reduce(
        (substitutedTemplate, value, index) =>
          substitutedTemplate.replaceAll(`{${index}}`, value),
        template,
      )
    : template;
}

function resolveSkillDescriptionParameters(
  values?: Array<string> | null,
): Array<string> | undefined {
  return values && values.length > 0 ? values : undefined;
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

function isResonatorSkill(row: EntitySkillRepositoryRow): row is ResonatorSkill {
  return 'skillGroupId' in row;
}

function isResonatorChain(row: EntitySkillRepositoryRow): row is ResonatorChain {
  return 'nodeName' in row;
}

function isWeaponEffect(row: EntitySkillRepositoryRow): row is WeaponEffect {
  return 'resonId' in row;
}
