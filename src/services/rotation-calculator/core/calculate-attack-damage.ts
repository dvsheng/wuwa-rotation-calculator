import { clamp, sum } from 'es-toolkit/math';
import { mapValues } from 'es-toolkit/object';

import type { CharacterDamageInstance, Enemy, NegativeStatus, Team } from '@/types';

import { calculateDamage } from '../damage-calculator';
import type { CalculateDamageProperties } from '../damage-calculator/calculate-damage.types';
import { calculateNegativeStatusDamage } from '../damage-calculator/calculate-negative-status-damage';

import {
  calculateAttackScalingPropertyValue,
  sumStatValues,
} from './calculate-stat-total';
import { createRuntimeStatResolver } from './resolve-runtime-stat-values';
import { getAttackScalingType } from './type-converters';
import { AttackScalingType } from './types';

const HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK = 0.02;

export type ResolvedDamageStatValues = Omit<CalculateDamageProperties, 'skill'>;

type AttackDamageResolvedInputs = ResolvedDamageStatValues & {
  skill: {
    motionValue?: number;
    negativeStatus?: NegativeStatus;
  };
};

interface DamageCalculationResult {
  result: number;
  inputs: AttackDamageResolvedInputs;
}

interface DamageCalculationStrategy {
  calculate: (
    instance: CharacterDamageInstance,
    resolvedStats: ResolvedDamageStatValues,
  ) => DamageCalculationResult;
}

const negativeStatusDamageStrategy: DamageCalculationStrategy = {
  calculate: (instance, resolvedStats) => {
    const calculateDamageProperties: AttackDamageResolvedInputs = {
      ...resolvedStats,
      skill: {
        negativeStatus: instance.scalingStat as NegativeStatus,
      },
    };
    if (!calculateDamageProperties.skill.negativeStatus) {
      throw new Error('Invalid negative status');
    }
    return {
      result: calculateNegativeStatusDamage(calculateDamageProperties),
      inputs: calculateDamageProperties,
    };
  },
};

const directDamageStrategy: DamageCalculationStrategy = {
  calculate: (instance, resolvedStats) => {
    const totalMotionValue = sum(instance.motionValues);
    const calculateDamageProperties: AttackDamageResolvedInputs = {
      ...resolvedStats,
      skill: {
        motionValue: totalMotionValue,
      },
    };
    return {
      result: calculateDamage(calculateDamageProperties as CalculateDamageProperties),
      inputs: calculateDamageProperties,
    };
  },
};

const flatDamageStrategy: DamageCalculationStrategy = {
  calculate: (instance, resolvedStats) => {
    const totalMotionValue = sum(instance.motionValues);
    const calculateDamageProperties: AttackDamageResolvedInputs = {
      ...resolvedStats,
      skill: {
        motionValue: totalMotionValue,
      },
    };
    return {
      result: totalMotionValue,
      inputs: calculateDamageProperties,
    };
  },
};

const getDamageCalculationStrategy = (instance: CharacterDamageInstance) => {
  const attackScalingType = getAttackScalingType(instance.scalingStat);
  switch (attackScalingType) {
    case AttackScalingType.NEGATIVE_STATUS: {
      return negativeStatusDamageStrategy;
    }
    case AttackScalingType.REGULAR: {
      return directDamageStrategy;
    }
    case AttackScalingType.FLAT: {
      return flatDamageStrategy;
    }
    default: {
      return directDamageStrategy;
    }
  }
};

export const resolveStatValues = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
): ResolvedDamageStatValues => {
  const { team, enemy } = context;
  const resolveStats = createRuntimeStatResolver(team, enemy);
  const character = team[instance.characterIndex];
  const resolvedCharacter = resolveStats(character);
  const resolvedEnemy = resolveStats(enemy);
  return {
    character: {
      level: character.level,
      attackScalingPropertyValue: calculateAttackScalingPropertyValue(
        resolvedCharacter.stats,
        instance.scalingStat,
      ),
      ...mapValues(resolvedCharacter.stats, sumStatValues),
      criticalRate: clamp(sumStatValues(resolvedCharacter.stats.criticalRate), 1),
    },
    enemy: {
      level: enemy.level,
      ...mapValues(resolvedEnemy.stats, sumStatValues),
      defenseReduction:
        sumStatValues(resolvedEnemy.stats.defenseReduction) +
        sumStatValues(resolvedEnemy.stats.havocBane) *
          HAVOC_BANE_DEFENSE_REDUCTION_PER_STACK,
    },
  };
};

export const calculateAttackDamage = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
) => {
  const resolvedStats = resolveStatValues(instance, context);
  const strategy = getDamageCalculationStrategy(instance);
  return strategy.calculate(instance, resolvedStats);
};
