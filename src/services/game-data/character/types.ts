import { z } from 'zod';

import type { Capability } from '@/schemas/rotation';
import type { Attribute } from '@/types';

import { GetEntityDetailsInputSchema } from '../common-types';
import type { BaseEntity, Capabilities } from '../common-types';

/**
 * The Resonance Chains equence at which a skill or bonus is unlocked.
 */
export const Sequence = {
  S1: 's1',
  S2: 's2',
  S3: 's3',
  S4: 's4',
  S5: 's5',
  S6: 's6',
} as const;

export type Sequence = (typeof Sequence)[keyof typeof Sequence];

/**
 * Categorizes the source of a character's capability.
 */
export const OriginType = {
  /** Capabilities from the character's unique mechanic */
  FORTE_CIRCUIT: 'Forte Circuit',
  /** Standard weapon attacks */
  NORMAL_ATTACK: 'Normal Attack',
  /** Character's E skill */
  RESONANCE_SKILL: 'Resonance Skill',
  /** Character's R ability */
  RESONANCE_LIBERATION: 'Resonance Liberation',
  /** Attack performed when switching the character in */
  INTRO_SKILL: 'Intro Skill',
  /** Buff/Effect triggered when switching the character out */
  OUTRO_SKILL: 'Outro Skill',
  /** Passive abilities unlocked at character breakpoints */
  INHERENT_SKILL: 'Inherent Skill',
  /** Base stats of the character */
  BASE_STATS: 'Base Stats',
  /** Specialized mechanics for certain characters */
  TUNE_BREAK: 'Tune Break',
  ...Sequence,
} as const;

export type OriginType = (typeof OriginType)[keyof typeof OriginType];

/**
 * Additional fields for all character capabilities to track origin and unlock conditions.
 */
export interface CharacterCapabilityProperties {
  /** Name of the capability */
  name: string;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName: string;
  /** Where this capability originates from in the character's kit */
  originType: OriginType;
  /** The sequence to unlock this entry. If undefined, it's part of the base kit. */
  unlockedAt?: Sequence;
  /**
   * The sequence at which this is disabled.
   * Usually because a sequence upgradessa buff in a way that is hard to express in a
   * parameterizable way, i.e. Aemeath s3.
   */
  disabledAt?: Sequence;
}

/**
 * Representation of a Character as stored in JSON files.
 */
export interface StoreCharacter extends BaseEntity {
  /** Elemental attribute of the character (e.g., Fusion, Glacio) */
  attribute: Attribute;
  /** Collection of attacks, modifiers, and stats for this character */
  capabilities: Capabilities<CharacterCapabilityProperties>;
}

/**
 * Zod schema for character details service input.
 */
export const GetCharacterDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The resonance chain sequence (0-6) of the character */
  sequence: z.number().min(0).max(6).default(0),
});

/**
 * Input to the character details service (whether internal or client-facing)
 */
export type GetCharacterDetailsInput = z.infer<typeof GetCharacterDetailsInputSchema>;

/**
 * Representation of a Character returned through the internal character details service
 */
export type Character = StoreCharacter;

/**
 * Representation of a Character returned through client-facing character details REST service
 */
export interface GetClientCharacterDetailsOutput {
  /** Name of the character */
  name: string;
  /** List of available attacks for the given sequence */
  attacks: Array<Omit<Capability, 'id' | 'characterName'>>;
  /** List of available stat modifiers for the given sequence */
  modifiers: Array<Omit<Capability, 'id' | 'characterName'>>;
}
