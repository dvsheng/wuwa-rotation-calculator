import { clamp } from 'es-toolkit/math';

import { AttackScalingProperty } from '@/types';
import type { CharacterStat, EnemyStat, NegativeStatus } from '@/types';

import type { CalculateDamageProperties } from '../damage-calculator';
import { calculateDamage } from '../damage-calculator';
import { getNegativeStatusBaseDamage } from '../damage-calculator/calculate-negative-status-damage';

import { calculateAttackScalingPropertyValue } from './calculate-stat-total';
import { getAttackScalingType } from './type-converters';
import type { Attack } from './types';
import { AttackScalingType } from './types';

const HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK = 0.02;

type DamageInstance = Pick<Attack, 'scalingStat' | 'motionValue'>;

type DamageCalculator = (
  stats: ReturnType<typeof convertResolvedStatsToCalculateDamageProperties>,
  instance: DamageInstance,
) => { inputs: CalculateDamageProperties; result: number };

export const calculateAttackDamage = (
  damageInstance: DamageInstance,
  characterStats: Record<CharacterStat | 'level', number>,
  enemyStats: Record<EnemyStat | 'level', number>,
) => {
  const damageCalculationStats = convertResolvedStatsToCalculateDamageProperties({
    damageInstance,
    characterStats,
    enemyStats,
  });

  const _calculateDamage = getDamageCalculationStrategy(damageInstance);
  return _calculateDamage(damageCalculationStats, damageInstance);
};

const getBaseScalingStat = (scalingStat: AttackScalingProperty) => {
  switch (scalingStat) {
    case AttackScalingProperty.TUNE_RUPTURE_ATK: {
      return AttackScalingProperty.ATK;
    }
    case AttackScalingProperty.TUNE_RUPTURE_HP: {
      return AttackScalingProperty.HP;
    }
    case AttackScalingProperty.TUNE_RUPTURE_DEF: {
      return AttackScalingProperty.DEF;
    }
    default: {
      return scalingStat;
    }
  }
};

const _calculateNegativeStatusDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: DamageInstance,
) => {
  if (
    getAttackScalingType(damageInstance.scalingStat) !==
    AttackScalingType.NEGATIVE_STATUS
  ) {
    throw new Error('Invalid strategy for non-negative-status damage calculation');
  }
  const negativeStatus = damageInstance.scalingStat as NegativeStatus;
  const baseDamage = getNegativeStatusBaseDamage(
    negativeStatus,
    damageCalculationStats.enemy[negativeStatus],
  );
  const calculateDamageProperties = {
    ...damageCalculationStats,
    baseDamage,
  };
  return {
    result: calculateDamage(calculateDamageProperties),
    inputs: calculateDamageProperties,
  };
};

const calculateStandardDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: DamageInstance,
) => {
  const baseDamage =
    damageCalculationStats.character.attackScalingPropertyValue *
    damageInstance.motionValue;
  const calculateDamageProperties = {
    ...damageCalculationStats,
    baseDamage,
  };
  return {
    result: calculateDamage(calculateDamageProperties),
    inputs: calculateDamageProperties,
  };
};

const calculateTuneRuptureDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: DamageInstance,
) => {
  const { result, inputs } = calculateStandardDamage(
    damageCalculationStats,
    damageInstance,
  );
  const tuneBreakBoostDamageBonus = inputs.character.tuneBreakBoost / 100;
  const damage = result * (1 + tuneBreakBoostDamageBonus);
  return {
    result: damage,
    inputs,
  };
};

const calculateFixedDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: DamageInstance,
) => {
  const baseDamage = damageInstance.motionValue;
  const calculateDamageProperties = {
    ...damageCalculationStats,
    baseDamage,
  };
  return {
    result: baseDamage,
    inputs: calculateDamageProperties,
  };
};

const getDamageCalculationStrategy = (instance: DamageInstance): DamageCalculator => {
  const attackScalingType = getAttackScalingType(instance.scalingStat);
  switch (attackScalingType) {
    case AttackScalingType.NEGATIVE_STATUS: {
      return _calculateNegativeStatusDamage;
    }
    case AttackScalingType.REGULAR: {
      return calculateStandardDamage;
    }
    case AttackScalingType.FIXED: {
      return calculateFixedDamage;
    }
    case AttackScalingType.TUNE_RUPTURE: {
      return calculateTuneRuptureDamage;
    }
    default: {
      throw new Error(`Unknown attack scaling type: ${attackScalingType}`);
    }
  }
};

const convertResolvedStatsToCalculateDamageProperties = ({
  damageInstance,
  characterStats,
  enemyStats,
}: {
  damageInstance: DamageInstance;
  characterStats: Record<CharacterStat | 'level', number>;
  enemyStats: Record<EnemyStat | 'level', number>;
}) => {
  const character = {
    ...characterStats,
    criticalRate: clamp(characterStats.criticalRate, 1),
    attackScalingPropertyValue: calculateAttackScalingPropertyValue(
      characterStats,
      getBaseScalingStat(damageInstance.scalingStat),
    ),
  };
  const enemy = {
    ...enemyStats,
    defenseReduction:
      enemyStats.defenseReduction +
      enemyStats.havocBane * HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK,
  };
  return {
    character,
    enemy,
  };
};
