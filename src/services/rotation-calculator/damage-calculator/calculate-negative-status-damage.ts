import { NegativeStatus } from '@/types';
import type { EnemyStat, NegativeStatus as NegativeStatusType } from '@/types';

import { calculateDefenseMultiplier } from './defense';
import { calculateResistanceMultiplier } from './resistance';

interface SkillProperties {
  negativeStatus?: NegativeStatusType;
}

type CharacterStats = Record<
  'damageAmplification' | 'defenseIgnore' | 'resistancePenetration' | 'level',
  number
>;

type EnemyStats = Record<EnemyStat | 'level', number>;

export interface CalculateNegativeStatusDamageProperties {
  character: CharacterStats;
  enemy: EnemyStats;
  skill: SkillProperties;
}

const NEGATIVE_STATUS_BASE_DAMAGE = 4595.365_72;

/**
 * Motion value percentages by stack count.
 * Values are stored as percentage fractions (e.g. 260% -> 2.6).
 */
const NEGATIVE_STATUS_STACK_MULTIPLIERS: Partial<
  Record<NegativeStatusType, Record<number, number>>
> = {
  [NegativeStatus.SPECTRO_FRAZZLE]: {
    1: 0.24,
    2: 0.4355,
    3: 0.6298,
    4: 0.8251,
    5: 1.02,
    6: 1.216,
    7: 1.409,
    8: 1.605,
    9: 1.8,
    10: 1.995,
    11: 2.2,
    12: 2.4,
    13: 2.6,
    14: 2.8,
    15: 3,
    16: 3.2,
    17: 3.4,
    18: 3.6,
    19: 3.8,
    20: 4,
  },
  [NegativeStatus.AERO_EROSION]: {
    1: 0.36,
    2: 0.899,
    3: 1.799,
    4: 2.698,
    5: 3.597,
    6: 4.497,
    7: 5.36,
    8: 6.211,
    9: 7.047,
  },
};

export const getNegativeStatusMotionValue = (
  negativeStatus: NegativeStatusType,
  stackCount: number,
): number => {
  const multiplier = NEGATIVE_STATUS_STACK_MULTIPLIERS[negativeStatus]?.[stackCount];
  return multiplier ?? 0;
};

export const calculateNegativeStatusDamage = (
  properties: CalculateNegativeStatusDamageProperties,
) => {
  if (!properties.skill.negativeStatus) return 0;

  const motionValue = getNegativeStatusMotionValue(
    properties.skill.negativeStatus,
    properties.enemy[properties.skill.negativeStatus],
  );
  if (motionValue <= 0) return 0;

  const defenseMultiplier = calculateDefenseMultiplier({
    characterLevel: properties.character.level,
    enemyLevel: properties.enemy.level,
    defenseReduction: properties.enemy.defenseReduction,
    defenseIgnore: properties.character.defenseIgnore,
  });
  const resistanceMultiplier = calculateResistanceMultiplier({
    baseResistance: properties.enemy.baseResistance,
    resistanceReduction: properties.enemy.resistanceReduction,
    resistancePenetration: properties.character.resistancePenetration,
  });
  const damageAmplifyMultiplier = 1 + properties.character.damageAmplification;
  return (
    NEGATIVE_STATUS_BASE_DAMAGE *
    motionValue *
    damageAmplifyMultiplier *
    defenseMultiplier *
    resistanceMultiplier
  );
};
