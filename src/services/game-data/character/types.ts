import { z } from 'zod';

import type { Capability } from '@/schemas/rotation';
import type { Attribute } from '@/types';

import { GetEntityDetailsInputSchema } from '../common-types';
import type { Attack, BaseEntity, Modifier, PermanentStat } from '../common-types';

/**
 * The Resonance Chain sequence at which a skill or bonus is unlocked.
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
 * Base properties shared by all character capabilities.
 */
interface CharacterCapabilityBase {
  /** Name of the capability */
  name: string;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName: string;
  /** Where this capability originates from in the character's kit */
  originType: OriginType;
  /** The sequence to unlock this entry. If undefined, it's part of the base kit. */
  unlockedAt?: Sequence;
}

/**
 * Fields that can be overridden in an alternative definition (excludes id and alternativeDefinition).
 */
type CharacterAttack = Omit<Attack, 'attribute'> & CharacterCapabilityBase;

type CharacterChildAttack = Pick<
  CharacterAttack,
  'description' | 'motionValues' | 'tags'
>;

type CharacterParentAttack = CharacterAttack & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildAttack>>;
};

type CharacterModifier = Modifier & CharacterCapabilityBase;

type CharacterChildModifier = Pick<
  CharacterModifier,
  'description' | 'target' | 'modifiedStats'
>;

type CharacterParentModifier = CharacterModifier & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildModifier>>;
};

/**
 * A character modifier with optional sequence-based alternatives.
 */
type CharacterPermanentStat = PermanentStat & CharacterCapabilityBase;

type CharacterChildPermanentStat = Pick<
  CharacterPermanentStat,
  'description' | 'value' | 'tags' | 'stat'
>;

/**
 * A character permanent stat with optional sequence-based alternatives.
 */
type CharacterParentPermanentStat = CharacterPermanentStat & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildPermanentStat>>;
};

/**
 * Container for all character capabilities.
 */
export interface CharacterCapabilities {
  attacks: Array<CharacterParentAttack>;
  modifiers: Array<CharacterParentModifier>;
  permanentStats: Array<CharacterParentPermanentStat>;
}

/**
 * Representation of a Character as stored in JSON files.
 */
export interface StoreCharacter extends BaseEntity {
  /** Elemental attribute of the character (e.g., Fusion, Glacio) */
  attribute: Attribute;
  /** Collection of attacks, modifiers, and stats for this character */
  capabilities: CharacterCapabilities;
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
