import type { Integer } from './common';
import type { RotationRuntimeResolvableNumber } from './parameterized-number';
import type { TaggedStatValue } from './tag';

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
  FINAL_DAMAGE_BONUS: 'finalDamageBonus',
  FLAT_DAMAGE: 'flatDamage',
  OFF_TUNE_BUILDUP_RATE: 'offTuneBuildupRate',
  TUNE_BREAK_BOOST: 'tuneBreakBoost',
  ENERGY_REGEN: 'energyRegen',
  HEALING_BONUS: 'healingBonus',
} as const;

export type CharacterStat = (typeof CharacterStat)[keyof typeof CharacterStat];

/**
 * A comprehensive record of a character's stats, where each value is an array of tagged instances
 * to allow for conditional application during damage calculations.
 */
export type CharacterStats<T = RotationRuntimeResolvableNumber | number> = Record<
  CharacterStat,
  Array<TaggedStatValue<T>>
>;

/**
 * Represents a character in the simulation context.
 */
export interface Character {
  /** Display name. */
  id: string;
  /** Progression level. */
  level: Integer;
  /** Current calculated stats. */
  stats: CharacterStats;
}

/**
 * A standard three-character team composition.
 */
export type Team = [Character, Character, Character];
