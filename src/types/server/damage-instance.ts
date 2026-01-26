import type { Attribute } from '@/types';

import type { Tag } from './tag';

/**
 * Defines the base stat used for damage scaling.
 */
export const AbilityAttribute = {
  /** Scales with Max HP. */
  HP: 'hp',
  /** Scales with ATK. */
  ATK: 'atk',
  /** Scales with DEF. */
  DEF: 'def',
} as const;

export type AbilityAttribute = (typeof AbilityAttribute)[keyof typeof AbilityAttribute];

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
  /** Tag for mid-air/aerial attacks. */
  AERIAL: 'aerial',
} as const;

export type DamageType = (typeof DamageType)[keyof typeof DamageType];

/**
 * A single damage-dealing instance, including its motion values and classification tags.
 */
export interface CharacterDamageInstance {
  /** Name of the character that performed the attack. */
  originCharacterName: string;
  /** Elemental attribute of the damage (e.g., Fusion, Glacio). */
  attribute: Attribute;
  /** The primary stat this damage scales with. */
  scalingStat: AbilityAttribute;
  /**
   * Motion values for each hit in the sequence (e.g., [0.112, 0.084, 0.084]).
   */
  motionValues: Array<number>;
  /** Tags for filtering modifiers (e.g., BasicAttack, Fusion). */
  tags: Array<Tag>;
}

/**
 * Checks if a string key is a valid AbilityAttribute.
 *
 * @param key - The key to check.
 * @returns True if the key is a valid AbilityAttribute.
 */
export const isAbilityAttribute = (key: string): key is AbilityAttribute => {
  return Object.values(AbilityAttribute).includes(key as AbilityAttribute);
};
