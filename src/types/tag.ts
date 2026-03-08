import type { NumberNode } from '@/services/rotation-calculator/core/resolve-runtime-number';

import { Attribute } from './attribute';
import { DamageType } from './damage-instance';
import { NegativeStatus } from './negative-status';

/**
 * A collection of commonly used strings in tags used for filtering and categorization during calculations.
 * Includes attributes, damage types, and status effects.
 */
export const Tag = {
  ...Attribute,
  ...DamageType,
  ...NegativeStatus,
  ALL: 'all',
  /** Attacks triggered by other characters. */
  COORDINATED_ATTACK: 'coordinatedAttack',
  /** Tag for mid-air/aerial attacks. */
  AERIAL: 'aerial',
  DODGE_COUNTER: 'dodgeCounter',
  // Character-specific tags for Echoes
  ROVER_AERO: 'Rover: Aero',
  CARTETHYIA: 'Cartethyia',
  AEMEATH: 'Aemeath',
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
export type StatValue = NumberNode;

/**
 * Combines a value with classification tags to allow for conditional logic.
 */
export type TaggedStatValue<T extends {} = {}> = Tagged & {
  value: NumberNode;
} & T;
