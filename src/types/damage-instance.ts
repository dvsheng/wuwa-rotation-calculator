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
  // TODO: Maybe TuneRupture versus ATK / DEF / HP
  // should be considered separately
  TUNE_RUPTURE_ATK: 'tuneRuptureAtk',
  TUNE_RUPTURE_HP: 'tuneRuptureHp',
  TUNE_RUPTURE_DEF: 'tuneRuptureDef',
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
  /** Tag for Intro skill specific modifiers. */
  INTRO: 'intro',
  /** Tag for Outro skill specific modifiers. */
  OUTRO: 'outro',
  TUNE_BREAK: 'tuneBreak',
  /** Tag for Tune Rupture specific multiplier increases. */
  TUNE_RUPTURE: 'tuneRupture',
} as const;

export type DamageType = (typeof DamageType)[keyof typeof DamageType];

/**
 * A single instance of damage, including its motion values and classification tags.
 */
export interface CharacterDamageInstance {
  /** The primary stat this damage scales with. */
  scalingStat: AttackScalingProperty;
  /**
   * Motion value / scaling value for the attack
   * For fixed damage, the motion value is the damage dealt by the fixed damage
   * For negative attributes, the motion value is the number of negative status stacks
   */
  motionValue: number;
  tags: Array<string>;
}

/**
 * A single damage-dealing attack, including its motion values and classification tags.
 */
export interface CharacterAttack {
  /** Index of the character performing the attack in the team array (0-2). */
  characterIndex: number;
  damageInstances: Array<CharacterDamageInstance>;
}
