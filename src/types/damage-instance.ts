import { NegativeStatus } from './negative-status';

/**
 * The stat by which an attack scales
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

/**
 * The type of damage dealt for a given attack. An damage instance can only
 * have one damage type, and many modifiers and permanent stats may target
 * specific damage types.
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
  NEGATIVE_STATUS: 'negativeStatus',
} as const;

export type DamageType = (typeof DamageType)[keyof typeof DamageType];
