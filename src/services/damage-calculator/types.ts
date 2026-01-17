import type { Integer } from '@/types';

interface SkillProps {
  motionValue: number;
}

interface CharacterStats {
  level: Integer;
  abilityAttributeValue: number;
  flatDamage: number;
  damageBonus: number;
  damageMultiplierBonus: number;
  damageAmplify: number;
  damageBonusFinal: number;
  criticalRate: number;
  criticalDamage: number;
  defenseIgnore: number;
  resistancePenetration: number;
}

interface EnemyStats {
  level: Integer;
  baseResistance: number;
  resistanceReduction: number;
  defenseReduction: number;
}

export interface CalculateDamageProps {
  character: CharacterStats;
  enemy: EnemyStats;
  skill: SkillProps;
}
