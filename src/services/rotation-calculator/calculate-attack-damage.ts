import type { CharacterDamageInstance, Enemy, Team } from '@/types/server';

import { calculateDamage } from '../damage-calculator';

import {
  getCalculateAbilityAttributeValueFn,
  getCalculateStatValueFn,
} from './calculate-stat-total';

export const calculateAttackDamage = (
  instance: CharacterDamageInstance,
  context: {
    team: Team;
    enemy: Enemy;
  },
) => {
  const getStatValue = getCalculateStatValueFn(instance.tags);
  const getScalingStatValue = getCalculateAbilityAttributeValueFn(instance.tags);
  const { team, enemy } = context;
  const character = team.find((c) => c.id === instance.originCharacterName);
  if (!character) {
    throw new Error(`Character ${instance.originCharacterName} not found`);
  }
  const calculateDamageEnemyProps = {
    level: enemy.level,
    baseResistance: getStatValue(enemy.stats.baseResistance),
    resistanceReduction: getStatValue(enemy.stats.resistanceReduction),
    defenseReduction: getStatValue(enemy.stats.defenseReduction),
  };
  const calculateDamageCharacterProps = {
    level: character.level,
    abilityAttributeValue: getScalingStatValue(character.stats, instance.scalingStat),
    flatDamage: getStatValue(character.stats.flatDamage),
    damageBonus: getStatValue(character.stats.damageBonus),
    damageMultiplierBonus: getStatValue(character.stats.damageMultiplierBonus),
    damageAmplify: getStatValue(character.stats.damageAmplification),
    defenseIgnore: getStatValue(character.stats.defenseIgnore),
    resistancePenetration: getStatValue(character.stats.resistancePenetration),
    criticalRate: getStatValue(character.stats.criticalRate),
    criticalDamage: getStatValue(character.stats.criticalDamage),
    damageBonusFinal: getStatValue(character.stats.finalDamageBonus),
  };
  return instance.motionValues.reduce((sum, motionValue) => {
    return (
      sum +
      calculateDamage({
        character: calculateDamageCharacterProps,
        enemy: calculateDamageEnemyProps,
        skill: { motionValue },
      })
    );
  }, 0);
};

export { getCalculateStatValueFn };
