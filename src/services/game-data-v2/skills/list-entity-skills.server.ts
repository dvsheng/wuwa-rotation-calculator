import { EntityType, OriginType, Sequence } from '@/services/game-data/types';

import type { SkillAttribute } from '../repostiory';
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

export interface EntitySkill {
  gameId: number;
  name: string;
  description: string;
  descriptionParameters?: Array<string>;
  iconUrl: string;
  originType: OriginType;
  damageIds: Array<number>;
  buffIds: Array<number>;
  skillAttributes?: Array<SkillAttribute>;
}

function substituteParameters(template: string, values?: Array<string>): string {
  return values
    ? values.reduce((substitutedTemplate, value, index) =>
        substitutedTemplate.replaceAll(`{${index}}`, value),
      template)
    : template;
}

function resolveSkillDescriptionParameters(
  values?: Array<string>,
): Array<string> | undefined {
  return values && values.length > 0 ? values : undefined;
}

async function listCharacterSkills(entityId: number): Promise<Array<EntitySkill>> {
  const [allSkills, allChains, allAttributes] = await Promise.all([
    resonatorSkills.list(),
    resonatorChains.list(),
    skillAttributesRepository.list(),
  ]);

  const attributesByLevelGroupId = Map.groupBy(
    allAttributes,
    (attribute) => attribute.skillLevelGroupId,
  );

  const skills = allSkills
    .filter((s) => s.skillGroupId === entityId && s.skillType !== 7)
    .map((s) => {
      const descriptionParameters = resolveSkillDescriptionParameters(
        s.multiSkillDetailNum.length > 0 ? s.multiSkillDetailNum : s.skillDetailNum,
      );

      return {
        gameId: s.id,
        name: s.skillName,
        description: substituteParameters(s.skillDescribe, descriptionParameters),
        descriptionParameters,
        iconUrl: s.icon,
        originType: mapSkillTypeToOriginType(s.skillType),
        damageIds: s.damageList ?? [],
        buffIds: s.buffList,
        skillAttributes: attributesByLevelGroupId.get(s.skillLevelGroupId) ?? [],
      };
    });

  const chains = allChains
    .filter((c) => c.groupId === entityId)
    .map((c) => ({
      gameId: c.id,
      name: c.nodeName,
      description: substituteParameters(
        c.attributesDescription,
        c.attributesDescriptionParams ?? undefined,
      ),
      descriptionParameters: c.attributesDescriptionParams ?? undefined,
      iconUrl: c.nodeIcon,
      originType: CHAIN_TO_SEQUENCE_MAP[c.groupIndex] ?? Sequence.S6,
      damageIds: [],
      buffIds: c.buffIds ?? [],
    }));

  return [...skills, ...chains];
}

async function listWeaponSkills(entityId: number): Promise<Array<EntitySkill>> {
  const weapon = await weapons.get(entityId);
  if (!weapon) throw new Error('invalid id');

  const allEffects = await weaponEffects.list();
  const resonEffects = allEffects.filter((effect) => effect.resonId === weapon.resonId);
  if (resonEffects.length === 0) return [];

  // Dedup by resonId, keep the lowest id (matching ingestSkillsV2 behaviour)
  const seen = new Set<number>();
  const deduped = resonEffects
    .toSorted((a, b) => a.id - b.id)
    .filter((effect) => {
      if (seen.has(effect.resonId)) return false;
      seen.add(effect.resonId);
      return true;
    });

  return deduped.map((effect) => ({
    gameId: effect.resonId,
    name: effect.name,
    description: weapon.desc,
    originType: OriginType.WEAPON,
    iconUrl: weapon.iconSmall,
    damageIds: [],
    buffIds: effect.effect,
  }));
}

async function listEchoSetSkills(entityId: number): Promise<Array<EntitySkill>> {
  const echoSet = await echoSets.get(entityId);
  if (!echoSet) throw new Error('invalid id');

  const fetterMap = echoSet.fetterMap as Array<{ Key: number; Value: number }>;
  const fetterIds = new Set(fetterMap.map((entry) => entry.Value));

  const allEffects = await echoSetEffects.list();
  return allEffects
    .filter((f) => fetterIds.has(f.id))
    .map((f) => ({
      gameId: f.id,
      name: f.name,
      description: f.effectDescription,
      originType: OriginType.ECHO_SET,
      iconUrl: f.fetterIcon,
      damageIds: [],
      buffIds: f.buffIds,
    }));
}

export async function listEntitySkillsHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<EntitySkill>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return listCharacterSkills(entityId);
    }
    case EntityType.WEAPON: {
      return listWeaponSkills(entityId);
    }
    case EntityType.ECHO_SET: {
      return listEchoSetSkills(entityId);
    }
    case EntityType.ECHO: {
      return [];
    }
  }
}
