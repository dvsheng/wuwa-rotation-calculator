import { z } from 'zod';

import type { Capability } from '@/schemas/rotation';
import type { Attribute } from '@/types';

import type { BaseEntity, Capabilities } from '../common-types';

/**
 * Represents the progression stage at which a skill or bonus is unlocked.
 * 'base' refers to the default kit, while 's1' through 's6' refer to Resonance Chain sequences.
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

export const OriginType = {
  FORTE_CIRCUIT: 'Forte Circuit',
  NORMAL_ATTACK: 'Normal Attack',
  RESONANCE_SKILL: 'Resonance Skill',
  RESONANCE_LIBERATION: 'Resonance Liberation',
  INTRO_SKILL: 'Intro Skill',
  OUTRO_SKILL: 'Outro Skill',
  INHERENT_SKILL: 'Inherent Skill',
  BASE_STATS: 'Base Stats',
  TUNE_BREAK: 'Tune Break',
  ...Sequence,
} as const;

export type OriginType = (typeof OriginType)[keyof typeof OriginType];

/**
 * Common fields for all game data entries to track origin and unlock conditions.
 */
export interface CharacterCapabilityProperties {
  name: string;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName: string;
  originType: OriginType;
  /** The sequence to unlock this entry.*/
  unlockedAt?: Sequence;
  /**
   * The sequence at which this is disabled.
   * Usually because a sequence upgrades a buff in a way that is hard to express in a
   * parameterizable way, i.e. Aemeath s3.
   */
  disabledAt?: Sequence;
}

/**
 * The core Character data structure used for damage calculations and rotation building.
 */
export interface Character extends BaseEntity {
  /** Attribute of the character */
  attribute: Attribute;
  capabilities: Capabilities<CharacterCapabilityProperties>;
}

export const GetClientCharacterDetailsInputSchema = z.object({
  id: z.string(),
  sequence: z.number().min(0).max(6).default(0),
});

export type GetClientCharacterDetailsInput = z.infer<
  typeof GetClientCharacterDetailsInputSchema
>;

export interface GetClientCharacterDetailsOutput {
  name: string;
  attacks: Array<Omit<Capability, 'id' | 'characterName'>>;
  modifiers: Array<Omit<Capability, 'id' | 'characterName'>>;
}
