import { compact, uniq, zip } from 'es-toolkit';

import type { NumberNode, Stat } from '@/services/game-data/types';
import { Target } from '@/services/game-data/types';
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
  NON_RATIO_STAT_MAP,
  getStatByGameAttributeId,
} from './constants';

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
    value,
  };
}

export function getBuffDuration(buffGraph: Array<RepositoryBuff>) {
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

export function getBuffTarget(
  statDefinition: Stat,
  buffGraph: Array<RepositoryBuff>,
): Target {
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
