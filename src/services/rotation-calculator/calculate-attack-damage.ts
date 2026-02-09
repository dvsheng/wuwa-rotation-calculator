import { clamp, sum } from 'es-toolkit/math';

import type { CharacterDamageInstance, Enemy, Team } from '@/types';

import {
  getCalculateAbilityAttributeValueFunction,
  getCalculateStatValueFunction,
} from './calculate-stat-total';
import { calculateDamage } from './damage-calculator';
import type { CalculateDamageProperties } from './damage-calculator/types';
import { createRuntimeStatResolver } from './resolve-stat-value';

export const calculateAttackDamage = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
) => {
  // TODO: remove duplicative tag filtering logic in createRuntimeStatResolver and
  // getCalculateStatValueFunction
  const getStatValue = getCalculateStatValueFunction(instance.tags);
  const getScalingStatValue = getCalculateAbilityAttributeValueFunction(instance.tags);
  const { team, enemy } = context;
  const resolveStats = createRuntimeStatResolver(team, enemy, instance.tags);
  // TODO: Switch instance.characterId to use positional index
  const character = team.find((c) => c.id === instance.characterId);
  if (!character) {
    throw new Error(`Character ${instance.characterId} not found`);
  }
  const resolvedCharacter = resolveStats(character);
  const resolvedEnemy = resolveStats(enemy);
  const calculateDamageEnemyProperties = {
    level: enemy.level,
    baseResistance: getStatValue(resolvedEnemy.stats.baseResistance),
    resistanceReduction: getStatValue(resolvedEnemy.stats.resistanceReduction),
    defenseReduction: getStatValue(resolvedEnemy.stats.defenseReduction),
  };
  const calculateDamageCharacterProperties = {
    level: character.level,
    abilityAttributeValue: getScalingStatValue(
      resolvedCharacter.stats,
      instance.scalingStat,
    ),
    flatDamage: getStatValue(resolvedCharacter.stats.flatDamage),
    damageBonus: getStatValue(resolvedCharacter.stats.damageBonus),
    damageMultiplierBonus: getStatValue(resolvedCharacter.stats.damageMultiplierBonus),
    damageAmplify: getStatValue(resolvedCharacter.stats.damageAmplification),
    defenseIgnore: getStatValue(resolvedCharacter.stats.defenseIgnore),
    resistancePenetration: getStatValue(resolvedCharacter.stats.resistancePenetration),
    criticalRate: clamp(getStatValue(resolvedCharacter.stats.criticalRate), 1),
    criticalDamage: getStatValue(resolvedCharacter.stats.criticalDamage),
    damageBonusFinal: getStatValue(resolvedCharacter.stats.finalDamageBonus),
  };
  const totalMotionValue = sum(instance.motionValues);
  const calculateDamageProperties: CalculateDamageProperties = {
    character: calculateDamageCharacterProperties,
    enemy: calculateDamageEnemyProperties,
    skill: { motionValue: totalMotionValue },
  };
  return {
    result: calculateDamage(calculateDamageProperties),
    inputs: calculateDamageProperties,
  };
};
