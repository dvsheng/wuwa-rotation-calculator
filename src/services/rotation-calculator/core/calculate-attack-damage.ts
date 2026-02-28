import { clamp } from 'es-toolkit/math';
import { mapValues } from 'es-toolkit/object';

import { AttackScalingProperty } from '@/types';
import type { CharacterDamageInstance, Enemy, NegativeStatus, Team } from '@/types';

import { calculateDamage } from '../damage-calculator';
import { getNegativeStatusBaseDamage } from '../damage-calculator/calculate-negative-status-damage';

import {
  calculateAttackScalingPropertyValue,
  sumStatValues,
} from './calculate-stat-total';
import type { ResolveRuntimeStatType } from './resolve-runtime-stat-values';
import { getAttackScalingType } from './type-converters';
import { AttackScalingType } from './types';

const HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK = 0.02;

const getBaseScalingStat = (scalingStat: CharacterDamageInstance['scalingStat']) => {
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
  damageInstance: CharacterDamageInstance,
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
  damageInstance: CharacterDamageInstance,
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
  damageInstance: CharacterDamageInstance,
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
  characterIndex,
  team,
  enemy: enemy_,
}: {
  damageInstance: CharacterDamageInstance;
  characterIndex: number;
  team: ResolveRuntimeStatType<Team>;
  enemy: ResolveRuntimeStatType<Enemy>;
}) => {
  const { stats, level } = team[characterIndex];
  const character = {
    ...mapValues(stats, sumStatValues),
    level: level,
    criticalRate: clamp(sumStatValues(stats.criticalRate), 1),
    attackScalingPropertyValue: calculateAttackScalingPropertyValue(
      stats,
      getBaseScalingStat(damageInstance.scalingStat),
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
