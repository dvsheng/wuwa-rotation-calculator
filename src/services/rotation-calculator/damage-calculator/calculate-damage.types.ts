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

interface EnemyStats {
  level: number;
  baseResistance: number;
  resistanceReduction: number;
  defenseReduction: number;
}

export interface CalculateDamageProperties {
  character: CharacterStats;
  enemy: EnemyStats;
  skill: SkillProperties;
}
