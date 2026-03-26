/**
 * A stat belonging to a character
 */
export const CharacterStat = {
  ATTACK_FLAT: 'attackFlat',
  ATTACK_SCALING_BONUS: 'attackScalingBonus',
  ATTACK_FLAT_BONUS: 'attackFlatBonus',
  DEFENSE_FLAT: 'defenseFlat',
  DEFENSE_SCALING_BONUS: 'defenseScalingBonus',
  DEFENSE_FLAT_BONUS: 'defenseFlatBonus',
  HP_FLAT: 'hpFlat',
  HP_SCALING_BONUS: 'hpScalingBonus',
  HP_FLAT_BONUS: 'hpFlatBonus',
  CRITICAL_RATE: 'criticalRate',
  CRITICAL_DAMAGE: 'criticalDamage',
  DEFENSE_IGNORE: 'defenseIgnore',
  RESISTANCE_PENETRATION: 'resistancePenetration',
  DAMAGE_BONUS: 'damageBonus',
  DAMAGE_AMPLIFICATION: 'damageAmplification',
  DAMAGE_MULTIPLIER_BONUS: 'damageMultiplierBonus',
  TUNE_STRAIN_DAMAGE_BONUS: 'tuneStrainDamageBonus',
  FINAL_DAMAGE_BONUS: 'finalDamageBonus',
  OFF_TUNE_BUILDUP_RATE: 'offTuneBuildupRate',
  TUNE_BREAK_BOOST: 'tuneBreakBoost',
  ENERGY_REGEN: 'energyRegen',
  HEALING_BONUS: 'healingBonus',
} as const;

export type CharacterStat = (typeof CharacterStat)[keyof typeof CharacterStat];
