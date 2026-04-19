import { OriginType, Sequence } from '@/services/game-data/types';

import type {
  EchoSetEffect,
  ResonatorChain,
  ResonatorSkill,
  WeaponEffect,
} from '../repostiory';

import { CHAIN_TO_SEQUENCE_MAP, SKILL_TYPE_TO_ORIGIN_TYPE_MAP } from './constants';
import type { EntitySkillContext } from './fetch-context';
import type { EntitySkillData, EntitySkillRepositoryRow } from './types';

export function transform(
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

function mapSkillTypeToOriginType(skillType: number): OriginType {
  return SKILL_TYPE_TO_ORIGIN_TYPE_MAP[skillType] ?? OriginType.NORMAL_ATTACK;
}

export function isResonatorSkill(row: EntitySkillRepositoryRow): row is ResonatorSkill {
  return 'skillGroupId' in row;
}

export function isResonatorChain(row: EntitySkillRepositoryRow): row is ResonatorChain {
  return 'nodeName' in row;
}

export function isWeaponEffect(row: EntitySkillRepositoryRow): row is WeaponEffect {
  return 'resonId' in row;
}
