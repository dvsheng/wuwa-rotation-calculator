import { calculateDefenseMultiplier } from './defense';
import { calculateResistanceMultiplier } from './resistance';
import type { CalculateDamageProperties } from './types';

export const calculateDamage = (properties: CalculateDamageProperties) => {
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
    properties.baseDamage *
    (1 + properties.character.damageBonus) *
    (1 + properties.character.damageAmplification) *
    (1 + properties.character.damageMultiplierBonus) *
    (1 + properties.character.finalDamageBonus) *
    (1 + properties.character.tuneStrainDamageBonus) *
    criticalMultiplier *
    defenseMultiplier *
    resistanceMultiplier;
  return totalDamage;
};
