import type { CalculateDamageProperties } from './calculate-damage.types';
import { calculateDefenseMultiplier } from './defense';
import { calculateResistanceMultiplier } from './resistance';

export const calculateDamage = (properties: CalculateDamageProperties) => {
  const damageBonusMultiplier = 1 + properties.character.damageBonus;
  const damageAmplifyMultiplier = 1 + properties.character.damageAmplification;
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
    damageBonusMultiplier *
    damageAmplifyMultiplier *
    (1 + properties.character.finalDamageBonus) *
    (1 + properties.character.tuneStrainDamageBonus) *
    criticalMultiplier *
    defenseMultiplier *
    resistanceMultiplier;
  return totalDamage;
};
