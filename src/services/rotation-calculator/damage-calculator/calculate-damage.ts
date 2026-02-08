import { calculateDefenseMultiplier } from './defense';
import { calculateResistanceMultiplier } from './resistance';
import type { CalculateDamageProperties } from './types';

export const calculateDamage = (properties: CalculateDamageProperties) => {
  const baseDamage =
    properties.character.abilityAttributeValue *
      (properties.skill.motionValue + properties.character.damageMultiplierBonus) +
    properties.character.flatDamage;
  const damageBonusMultiplier = 1 + properties.character.damageBonus;
  const damageAmplifyMultiplier = 1 + properties.character.damageAmplify;
  const criticalMultiplier =
    1 + properties.character.criticalRate * properties.character.criticalDamage;
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
  const totalDamage =
    baseDamage *
    damageBonusMultiplier *
    damageAmplifyMultiplier *
    (1 + properties.character.damageBonusFinal) *
    criticalMultiplier *
    defenseMultiplier *
    resistanceMultiplier;
  return totalDamage;
};
