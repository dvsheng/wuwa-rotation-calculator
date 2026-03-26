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
