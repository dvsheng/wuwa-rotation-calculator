import { clamp, sum } from 'es-toolkit/math';

import type { CharacterDamageInstance, Enemy, Team } from '@/types';

import { calculateDamage } from '../damage-calculator';
import type { CalculateDamageProperties } from '../damage-calculator/types';

import {
  getCalculateAbilityAttributeValueFunction,
  getCalculateStatValueFunction,
} from './calculate-stat-total';

export const calculateAttackDamage = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
) => {
  const getStatValue = getCalculateStatValueFunction(instance.tags);
  const getScalingStatValue = getCalculateAbilityAttributeValueFunction(instance.tags);
  const { team, enemy } = context;
  const character = team.find((c) => c.id === instance.originCharacterName);
  if (!character) {
    throw new Error(`Character ${instance.originCharacterName} not found`);
  }
  const calculateDamageEnemyProperties = {
    level: enemy.level,
    baseResistance: getStatValue(enemy.stats.baseResistance),
    resistanceReduction: getStatValue(enemy.stats.resistanceReduction),
    defenseReduction: getStatValue(enemy.stats.defenseReduction),
  };
  const calculateDamageCharacterProperties = {
    level: character.level,
    abilityAttributeValue: getScalingStatValue(character.stats, instance.scalingStat),
    flatDamage: getStatValue(character.stats.flatDamage),
    damageBonus: getStatValue(character.stats.damageBonus),
    damageMultiplierBonus: getStatValue(character.stats.damageMultiplierBonus),
    damageAmplify: getStatValue(character.stats.damageAmplification),
    defenseIgnore: getStatValue(character.stats.defenseIgnore),
    resistancePenetration: getStatValue(character.stats.resistancePenetration),
    criticalRate: clamp(getStatValue(character.stats.criticalRate), 1),
    criticalDamage: getStatValue(character.stats.criticalDamage),
    damageBonusFinal: getStatValue(character.stats.finalDamageBonus),
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
