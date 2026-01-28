import { Attribute } from './attribute';
import { DamageType } from './damage-instance';
import { NegativeStatus } from './negative-status';
import type { RotationRuntimeResolvableNumber } from './parameterized-number';

/**
 * A collection of commonly used strings in tags used for filtering and categorization during calculations.
 * Includes attributes, damage types, and status effects.
 */
export const Tag = {
  ...Attribute,
  ...DamageType,
  ...NegativeStatus,
  ALL: 'all',
  /** Tag for Tune Rupture specific multiplier increases. */
  TUNE_RUPTURE: 'tuneRupture',
  /** Tag for Tune Strain specific multiplier increases. */
  TUNE_STRAIN: 'tuneStrain',
} as const;

export type Tag = (typeof Tag)[keyof typeof Tag];

/**
 * Common interface for items that can be categorized by tags.
 */
export interface Tagged {
  /** The set of tags associated with the entry. */
  tags: Array<string>;
}

/**
 * A stat value can either be a static number or a dynamically resolved value in the rotation.
 */
export type StatValue = number | RotationRuntimeResolvableNumber;

/**
 * Combines a value with classification tags to allow for conditional logic.
 */
export interface TaggedStatValue<
  T = number | RotationRuntimeResolvableNumber,
> extends Tagged {
  /** The magnitude of the stat, possibly dependent on character stats. */
  value: T;
}
