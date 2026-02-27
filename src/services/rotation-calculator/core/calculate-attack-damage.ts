import { clamp } from 'es-toolkit/math';
import { mapValues } from 'es-toolkit/object';

import type { CharacterDamageInstance, Enemy, NegativeStatus, Team } from '@/types';

import { calculateDamage } from '../damage-calculator';
import type { CalculateDamageProperties } from '../damage-calculator/calculate-damage.types';
import { calculateNegativeStatusDamage } from '../damage-calculator/calculate-negative-status-damage';

import {
  calculateAttackScalingPropertyValue,
  sumStatValues,
} from './calculate-stat-total';
import type { ResolveRuntimeStatType } from './resolve-runtime-stat-values';
import { getAttackScalingType } from './type-converters';
import { AttackScalingType } from './types';

const HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK = 0.02;

export const calculateAttackDamage = (
  damageInstance: CharacterDamageInstance,
  characterIndex: number,
  team: ResolveRuntimeStatType<Team>,
  enemy: ResolveRuntimeStatType<Enemy>,
) => {
  const damageCalculationStats = convertResolvedStatsToCalculateDamageProperties({
    damageInstance,
    characterIndex,
    team,
    enemy,
  });

  const _calculateDamage = getDamageCalculationStrategy(damageInstance);
  return _calculateDamage(damageCalculationStats, damageInstance);
};

const _calculateNegativeStatusDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: CharacterDamageInstance,
) => {
  if (
    getAttackScalingType(damageInstance.scalingStat) !==
    AttackScalingType.NEGATIVE_STATUS
  ) {
    throw new Error('Invalid strategy for non-negative-status damage calculation');
  }
  const negativeStatus = damageInstance.scalingStat as NegativeStatus;
  const calculateDamageProperties = {
    ...damageCalculationStats,
    skill: {
      motionValue: damageCalculationStats.enemy[negativeStatus],
      negativeStatus: negativeStatus,
    },
  };
  return {
    result: calculateNegativeStatusDamage(calculateDamageProperties),
    inputs: calculateDamageProperties,
  };
};

const calculateStandardDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: CharacterDamageInstance,
) => {
  const calculateDamageProperties = {
    ...damageCalculationStats,
    skill: {
      motionValue: damageInstance.motionValue,
    },
  };
  return {
    result: calculateDamage(calculateDamageProperties),
    inputs: calculateDamageProperties,
  };
};

const calculateFixedDamage = (
  damageCalculationStats: ReturnType<
    typeof convertResolvedStatsToCalculateDamageProperties
  >,
  damageInstance: CharacterDamageInstance,
) => {
  const calculateDamageProperties = {
    ...damageCalculationStats,
    skill: {
      motionValue: damageInstance.motionValue,
    },
  };
  return {
    result: damageInstance.motionValue,
    inputs: calculateDamageProperties,
  };
};

const getDamageCalculationStrategy = (instance: CharacterDamageInstance) => {
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
    default: {
      return calculateStandardDamage;
    }
  }
};

const convertResolvedStatsToCalculateDamageProperties = ({
  damageInstance,
  characterIndex,
  team,
  enemy: enemy_,
}: {
  damageInstance: CharacterDamageInstance;
  characterIndex: number;
  team: ResolveRuntimeStatType<Team>;
  enemy: ResolveRuntimeStatType<Enemy>;
}): Omit<CalculateDamageProperties, 'skill'> => {
  const { stats, level } = team[characterIndex];
  const character = {
    ...mapValues(stats, sumStatValues),
    level: level,
    criticalRate: clamp(sumStatValues(stats.criticalRate), 1),
    attackScalingPropertyValue: calculateAttackScalingPropertyValue(
      stats,
      damageInstance.scalingStat,
    ),
  };
  const enemy = {
    ...mapValues(enemy_.stats, sumStatValues),
    level: enemy_.level,
    defenseReduction:
      sumStatValues(enemy_.stats.defenseReduction) +
      sumStatValues(enemy_.stats.havocBane) * HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK,
  };
  return {
    character,
    enemy,
  };
};
