import { compact, uniq, zip } from 'es-toolkit';

import type { NumberNode, Stat } from '@/services/game-data/types';
import { CapabilityType, Target } from '@/services/game-data/types';
import { Tag } from '@/types';

import {
  DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP,
  ELEMENT_ID_TO_ATTRIBUTE_MAP,
} from '../constants';
import { getIdsFromString } from '../get-capabilities';
import type { Buff as RepositoryBuff } from '../repostiory';

import {
  DAMAGE_SUBTYPE_TO_TAG_MAP,
  ENEMY_STAT_SET,
  ExtraEffectID,
  ExtraEffectRequirement,
  NEGATIVE_MAGNITUDE_STAT_MAP,
  NEGATIVE_STATUS_BUFF_ID_TO_STAT,
  NON_RATIO_STAT_MAP,
  STANDARD_RATIO_STAT_MAP,
} from './constants';
import type { BuffContext } from './fetch-context';
import type { BuffData } from './types';

const ENEMY_REQUIREMENT_TARGET = 1;
const ENERGY_ATTRIBUTE_ID = 62;
const CONCERTO_ATTRIBUTE_ID = 77;

function getEnergyOrConcertoData(
  buff: RepositoryBuff,
): Pick<BuffData, 'energy' | 'concertoRegen'> | undefined {
  if (buff.modifierMagnitude.length === 0) return;
  const magnitude = buff.modifierMagnitude[0];
  if (buff.gameAttributeId === ENERGY_ATTRIBUTE_ID) return { energy: magnitude };
  if (buff.gameAttributeId === CONCERTO_ATTRIBUTE_ID)
    return { concertoRegen: magnitude };
}

export function toBuff(
  buff: RepositoryBuff,
  context: BuffContext,
): BuffData | undefined {
  const stat = getBuffStat(buff);
  const energyConcertoData = getEnergyOrConcertoData(buff);

  if (!stat && !energyConcertoData) return;

  const target = stat
    ? getBuffTarget(stat, [buff])
    : buff.formationPolicy === 1 ||
        buff.formationPolicy === 2 ||
        buff.formationPolicy === 5
      ? Target.TEAM
      : Target.SELF;

  return {
    buffId: buff.id,
    type: isPermanentStat(buff)
      ? CapabilityType.PERMANENT_STAT
      : CapabilityType.MODIFIER,
    duration: getBuffDuration([buff]),
    target,
    ...stat,
    ...energyConcertoData,
    ...context.sequenceInfoByBuffId.get(buff.id),
  };
}

function mapExtraEffectRequirementToAttackTag(parameter: string): Tag | undefined {
  const damageType =
    DAMAGE_INSTANCE_TYPE_TO_DAMAGE_TYPE_MAP[Number.parseInt(parameter)];
  return damageType;
}

function inferTagsFromExtraEffects(buff: RepositoryBuff): Array<string> {
  return compact(
    uniq(
      zip(buff.extraEffectRequirements, buff.extraEffectReqPara).flatMap(
        ([requirement, parameter]) => {
          switch (requirement) {
            case ExtraEffectRequirement.OnDamageType: {
              return [mapExtraEffectRequirementToAttackTag(String(parameter))];
            }
            case ExtraEffectRequirement.OnAttribute: {
              return [ELEMENT_ID_TO_ATTRIBUTE_MAP[Number.parseInt(parameter)]];
            }
            case ExtraEffectRequirement.OnDamageSubtype: {
              const requirementParameter = parameter.split('#').at(1);
              if (!requirementParameter) return;
              return DAMAGE_SUBTYPE_TO_TAG_MAP[requirementParameter];
            }
            case ExtraEffectRequirement.OnDamageInstances: {
              return getIdsFromString(parameter).map(String);
            }
            default: {
              return [];
            }
          }
        },
      ),
    ),
  );
}

function getBuffStatIdAndMagnitude(buff: RepositoryBuff) {
  if (buff.gameAttributeId && buff.modifierMagnitude.length > 0) {
    return {
      statId: buff.gameAttributeId,
      modifierMagnitude: buff.modifierMagnitude[0],
    };
  }

  const extraEffectMagnitude = buff.extraEffectParametersGrow1[0];
  if (!extraEffectMagnitude) return;

  if (buff.extraEffectId === ExtraEffectID.ModifyProperty) {
    const statId = Number.parseInt(buff.extraEffectParameters[1]);
    if (statId === 10) {
      return {
        statId: 99,
        modifierMagnitude: extraEffectMagnitude,
      };
    }

    if (statId === 16 && buff.extraEffectParameters[0] === '1') {
      return {
        statId,
        modifierMagnitude: -extraEffectMagnitude,
      };
    }

    return {
      statId,
      modifierMagnitude: extraEffectMagnitude,
    };
  }

  if (buff.extraEffectId === ExtraEffectID.DamageAmplifier) {
    return {
      statId: buff.extraEffectId,
      modifierMagnitude: extraEffectMagnitude,
    };
  }
}

function buildTags(
  baseTags: Array<string>,
  triggerTags: Array<string> = [],
): Array<string> {
  const tags = [...baseTags, ...triggerTags];
  return tags.length > 0 ? tags : [Tag.ALL];
}

function buildRuntimeParameterizedStatValue(buff: RepositoryBuff) {
  const statId = buff.calculationPolicy.at(1);
  if (!statId) return;
  const isFlatOutput =
    buff.calculationPolicy.at(0) === 2 && NON_RATIO_STAT_MAP[buff.gameAttributeId];
  const divisor = isFlatOutput ? 1 : 10_000;
  const stat = getStatByGameAttributeId(statId, 0, !isFlatOutput)?.stat;
  if (!stat) return;
  const scaleStartsAt = buff.calculationPolicy.at(5);
  const maximum = buff.calculationPolicy.at(7);
  const step = buff.calculationPolicy.at(6) ?? 1;
  const scale = buff.modifierMagnitude[0];

  const statNode = {
    type: 'statParameterizedNumber',
    stat,
    resolveWith: 'self',
  } as const;
  return {
    type: 'clamp',
    maximum: maximum ? maximum / divisor : Infinity,
    minimum: 0,
    operand: {
      type: 'product',
      operands: [
        scale / step / divisor,
        scaleStartsAt
          ? {
              type: 'sum',
              operands: [statNode, -scaleStartsAt / 10_000],
            }
          : statNode,
      ],
    },
  } satisfies NumberNode;
}

function buildStackParameterizedValue(
  value: NumberNode,
  maximumStacks: number,
): NumberNode {
  if (typeof value === 'number') {
    return {
      type: 'userParameterizedNumber',
      parameterId: '0',
      minimum: 0,
      maximum: maximumStacks,
      scale: value,
    };
  }

  return {
    type: 'product',
    operands: [
      value,
      {
        type: 'userParameterizedNumber',
        parameterId: '0',
        minimum: 0,
        maximum: maximumStacks,
      },
    ],
  };
}

function buildNegativeStatusConditionalValue(
  buff: RepositoryBuff,
  value: NumberNode,
): NumberNode {
  const statusRequirements = zip(
    buff.extraEffectRequirements,
    buff.extraEffectReqPara,
  ).flatMap(([requirement, parameter]) => {
    if (requirement !== ExtraEffectRequirement.OnBuffStack || !parameter) return [];

    const [buffId, target, lowerBound, reverseBound] = parameter
      .split('#')
      .map((part) => Number.parseInt(part, 10));
    const stat = NEGATIVE_STATUS_BUFF_ID_TO_STAT[buffId];
    if (
      !stat ||
      target !== ENEMY_REQUIREMENT_TARGET ||
      !Number.isFinite(lowerBound) ||
      !Number.isFinite(reverseBound)
    ) {
      return [];
    }

    return [
      {
        stat,
        threshold: lowerBound,
        reverseThreshold: reverseBound,
      },
    ];
  });

  if (statusRequirements.length === 0) return value;

  return statusRequirements.reduceRight<NumberNode>(
    (valueIfFalse, requirement) => ({
      type: 'conditional',
      operand: {
        type: 'statParameterizedNumber',
        stat: requirement.stat,
        resolveWith: 'enemy',
      },
      operator: '>=',
      threshold: requirement.threshold,
      reverseThreshold: requirement.reverseThreshold,
      valueIfTrue: value,
      valueIfFalse,
    }),
    0,
  );
}

export function getBuffStat(b: RepositoryBuff): Stat | undefined {
  const statLookup = getBuffStatIdAndMagnitude(b);
  if (!statLookup) return;
  const isFlatStat = b.calculationPolicy.at(0) === 2;

  const baseStat = getStatByGameAttributeId(
    statLookup.statId,
    statLookup.modifierMagnitude,
    isFlatStat,
  );
  if (!baseStat) return;

  const triggerTags = inferTagsFromExtraEffects(b);
  const tags = buildTags(baseStat.tags, triggerTags);

  const value =
    b.stackLimitCount > 1
      ? buildStackParameterizedValue(baseStat.value, b.stackLimitCount)
      : (buildRuntimeParameterizedStatValue(b) ?? baseStat.value);
  return {
    stat: baseStat.stat,
    tags,
    value: buildNegativeStatusConditionalValue(b, value),
  };
}

function getBuffDuration(buffGraph: Array<RepositoryBuff>) {
  const leafBuff = buffGraph.at(-1);
  const parentBuff = buffGraph.at(-2);
  if (
    leafBuff?.extraEffectId === 38 &&
    parentBuff?.extraEffectId === 58 &&
    parentBuff.durationMagnitude.length > 0 &&
    parentBuff.durationMagnitude[0] > 0
  ) {
    return parentBuff.durationMagnitude[0];
  }
  if (!leafBuff) return;

  if (leafBuff.durationMagnitude.length > 0 && leafBuff.durationMagnitude[0] > 0) {
    return leafBuff.durationMagnitude[0];
  }
}

function getBuffTarget(statDefinition: Stat, buffGraph: Array<RepositoryBuff>): Target {
  if (ENEMY_STAT_SET.has(statDefinition.stat)) {
    return Target.ENEMY;
  }

  const leafBuff = buffGraph.at(-1);
  if (!leafBuff) return Target.SELF;
  return leafBuff.formationPolicy === 1 ||
    leafBuff.formationPolicy === 2 ||
    leafBuff.formationPolicy === 5
    ? Target.TEAM
    : Target.SELF;
}

const isPermanentStat = (buff: RepositoryBuff) => {
  return (
    (buff.durationMagnitude.length === 0 || buff.durationMagnitude[0] > 60) &&
    buff.extraEffectRequirements.filter(
      (requirement) =>
        requirement !== ExtraEffectRequirement.OnAttribute &&
        requirement !== ExtraEffectRequirement.OnDamageType &&
        requirement !== ExtraEffectRequirement.OnSkillTreeUnlock &&
        requirement !== ExtraEffectRequirement.OnDamageInstances &&
        requirement !== ExtraEffectRequirement.OnBuffStack,
    ).length === 0
  );
};

function getStatByGameAttributeId(
  gameAttributeId: number,
  modifierMagnitude: number,
  isFlatStat: boolean = false,
): Stat | undefined {
  const normalizedStatId =
    gameAttributeId >= 10_000 ? gameAttributeId - 10_000 : gameAttributeId;
  const negativeMagnitudeStat =
    modifierMagnitude < 0 ? NEGATIVE_MAGNITUDE_STAT_MAP[normalizedStatId] : undefined;
  if (negativeMagnitudeStat) {
    return {
      ...negativeMagnitudeStat,
      value: Math.abs(toBasisPointsValue(modifierMagnitude)),
    };
  }

  if (isFlatStat) {
    const nonRatioStat = NON_RATIO_STAT_MAP[normalizedStatId];
    if (nonRatioStat) {
      return {
        ...nonRatioStat,
        value: modifierMagnitude,
      };
    }
  }

  const standardRatioStat = STANDARD_RATIO_STAT_MAP[normalizedStatId];
  if (!standardRatioStat) {
    return undefined;
  }

  return {
    ...standardRatioStat,
    value: toNormalizedRatioValue(normalizedStatId, modifierMagnitude),
  };
}

function toBasisPointsValue(modifierMagnitude: number) {
  return modifierMagnitude / 10_000;
}

function toNormalizedRatioValue(gameAttributeId: number, modifierMagnitude: number) {
  const basisPointsValue = toBasisPointsValue(modifierMagnitude);
  return [30, 34, 99].includes(gameAttributeId)
    ? Math.abs(basisPointsValue)
    : basisPointsValue;
}
