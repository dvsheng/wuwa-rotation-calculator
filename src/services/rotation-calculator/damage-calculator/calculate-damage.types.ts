import type { EnemyStat } from '@/types';

interface SkillProperties {
  motionValue: number;
}

interface CharacterStats {
  level: number;
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

export interface CalculateDamageProperties {
  character: CharacterStats;
  enemy: Record<EnemyStat | 'level', number>;
  skill: SkillProperties;
}
