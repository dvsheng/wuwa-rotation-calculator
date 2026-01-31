import { calculateDefenseMultiplier } from './defense';
import { calculateResistanceMultiplier } from './resistance';
import type { CalculateDamageProps } from './types';

export const calculateDamage = (props: CalculateDamageProps) => {
  const baseDamage =
    props.character.abilityAttributeValue *
      (props.skill.motionValue + props.character.damageMultiplierBonus) +
    props.character.flatDamage;
  const damageBonusMultiplier = 1 + props.character.damageBonus;
  const damageAmplifyMultiplier = 1 + props.character.damageAmplify;
  const criticalMultiplier =
    1 + props.character.criticalRate * props.character.criticalDamage;
  const defenseMultiplier = calculateDefenseMultiplier({
    characterLevel: props.character.level,
    enemyLevel: props.enemy.level,
    defenseReduction: props.enemy.defenseReduction,
    defenseIgnore: props.character.defenseIgnore,
  });
  const resistanceMultiplier = calculateResistanceMultiplier({
    baseResistance: props.enemy.baseResistance,
    resistanceReduction: props.enemy.resistanceReduction,
    resistancePenetration: props.character.resistancePenetration,
  });
  const totalDamage =
    baseDamage *
    damageBonusMultiplier *
    damageAmplifyMultiplier *
    (1 + props.character.damageBonusFinal) *
    criticalMultiplier *
    defenseMultiplier *
    resistanceMultiplier;
  return totalDamage;
};
