import { clamp, sum } from 'es-toolkit/math';

import { isNegativeStatusAbilityAttribute } from '@/types';
import type { CharacterDamageInstance, Enemy, Team } from '@/types';

import { calculateDamage } from '../damage-calculator';
import { calculateNegativeStatusDamage } from '../damage-calculator/calculate-negative-status-damage';

import { calculateAbilityAttributeValue, sumStatValues } from './calculate-stat-total';
import { createRuntimeStatResolver } from './resolve-runtime-stat-values';

export const calculateAttackDamage = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
) => {
  const { team, enemy } = context;
  const resolveStats = createRuntimeStatResolver(team, enemy);
  const character = team[instance.characterIndex];
  const resolvedCharacter = resolveStats(character);
  const resolvedEnemy = resolveStats(enemy);
  const calculateDamageEnemyProperties = {
    level: enemy.level,
    baseResistance: sumStatValues(resolvedEnemy.stats.baseResistance),
    resistanceReduction: sumStatValues(resolvedEnemy.stats.resistanceReduction),
    defenseReduction: sumStatValues(resolvedEnemy.stats.defenseReduction),
    spectroFrazzle: sumStatValues(resolvedEnemy.stats.spectroFrazzle),
    aeroErosion: sumStatValues(resolvedEnemy.stats.aeroErosion),
    fusionBurst: sumStatValues(resolvedEnemy.stats.fusionBurst),
    glacioChafe: sumStatValues(resolvedEnemy.stats.glacioChafe),
    havocBane: sumStatValues(resolvedEnemy.stats.havocBane),
    electroFlare: sumStatValues(resolvedEnemy.stats.electroFlare),
  };
  const calculateDamageCharacterProperties = {
    level: character.level,
    abilityAttributeValue: calculateAbilityAttributeValue(
      resolvedCharacter.stats,
      instance.scalingStat,
    ),
    flatDamage: sumStatValues(resolvedCharacter.stats.flatDamage),
    damageBonus: sumStatValues(resolvedCharacter.stats.damageBonus),
    damageMultiplierBonus: sumStatValues(resolvedCharacter.stats.damageMultiplierBonus),
    damageAmplify: sumStatValues(resolvedCharacter.stats.damageAmplification),
    defenseIgnore: sumStatValues(resolvedCharacter.stats.defenseIgnore),
    resistancePenetration: sumStatValues(resolvedCharacter.stats.resistancePenetration),
    criticalRate: clamp(sumStatValues(resolvedCharacter.stats.criticalRate), 1),
    criticalDamage: sumStatValues(resolvedCharacter.stats.criticalDamage),
    damageBonusFinal: sumStatValues(resolvedCharacter.stats.finalDamageBonus),
  };

  const baseCalculateDamageProperties = {
    character: calculateDamageCharacterProperties,
    enemy: calculateDamageEnemyProperties,
  };
  if (isNegativeStatusAbilityAttribute(instance.scalingStat)) {
    const negativeStatus = instance.scalingStat;
    const calculateDamageProperties = {
      ...baseCalculateDamageProperties,
      skill: {
        negativeStatus,
      },
    };
    return {
      result: calculateNegativeStatusDamage(calculateDamageProperties),
      inputs: calculateDamageProperties,
    };
  } else {
    const totalMotionValue = sum(instance.motionValues);
    const calculateDamageProperties = {
      ...baseCalculateDamageProperties,
      skill: {
        motionValue: totalMotionValue,
      },
    };
    return {
      result: calculateDamage(calculateDamageProperties),
      inputs: calculateDamageProperties,
    };
  }
};
