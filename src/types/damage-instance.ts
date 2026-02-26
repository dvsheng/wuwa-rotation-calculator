import { NegativeStatus } from './negative-status';

/**
 * Defines the base stat used for damage scaling.
 */
export const AttackScalingProperty = {
  /** Scales with Max HP. */
  HP: 'hp',
  /** Scales with ATK. */
  ATK: 'atk',
  /** Scales with DEF. */
  DEF: 'def',
  FIXED: 'fixed',
  ...NegativeStatus,
} as const;

export type AttackScalingProperty =
  (typeof AttackScalingProperty)[keyof typeof AttackScalingProperty];

export const AttackScalingType = {
  REGULAR: 'regular',
  NEGATIVE_STATUS: 'negativeStatus',
  FLAT: 'flat',
};

/**
 * Categorizes the source of damage for tag-based filtering.
 */
export const DamageType = {
  /** Standard normal attacks. */
  BASIC_ATTACK: 'basicAttack',
  /** Charged or specialized heavy attacks. */
  HEAVY_ATTACK: 'heavyAttack',
  /** Resonance Skill usage. */
  RESONANCE_SKILL: 'resonanceSkill',
  /** Resonance Liberation usage. */
  RESONANCE_LIBERATION: 'resonanceLiberation',
  /** Damage from active Echoes. */
  ECHO: 'echo',
  /** Attacks triggered by other characters. */
  COORDINATED_ATTACK: 'coordinatedAttack',
  /** Tag for Intro skill specific modifiers. */
  INTRO: 'intro',
  /** Tag for Outro skill specific modifiers. */
  OUTRO: 'outro',
  DODGE_COUNTER: 'dodgeCounter',
  /** Tag for mid-air/aerial attacks. */
  AERIAL: 'aerial',
} as const;

export type DamageType = (typeof DamageType)[keyof typeof DamageType];

/**
 * A single damage-dealing instance, including its motion values and classification tags.
 */
export interface CharacterDamageInstance {
  /** Index of the character performing the attack in the team array (0-2). */
  characterIndex: number;
  /** The primary stat this damage scales with. */
  scalingStat: AttackScalingProperty;
  /**
   * Motion values for each hit in the sequence (e.g., [0.112, 0.084, 0.084]).
   */
  motionValues: Array<number>;
  /** Tags for filtering modifiers (e.g., BasicAttack, Fusion). */
  tags: Array<string>;
}

/**
 * Checks if a string key is a valid AttackScalingProperty.
 *
 * @param key - The key to check.
 * @returns True if the key is a valid AttackScalingProperty.
 */
export const isAttackScalingProperty = (key: string): key is AttackScalingProperty => {
  return Object.values(AttackScalingProperty).includes(key as AttackScalingProperty);
};
