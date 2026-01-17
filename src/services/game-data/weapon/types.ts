import type { CharacterStat } from '@/types/server';

import type { Attack, BaseEntity, Modifiers, PermanentStats } from '../common-types';

export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

interface RefineProperties {
  /**
   * An additional attack that a weapon adds.
   */
  attack?: Attack;
  /**
   * Temporary or conditional buffs (e.g., Outro skills, field effects).
   */
  modifiers: Modifiers;
  /**
   * Permanent stats that are derived from the weapon's special effect
   */
  stats: PermanentStats;
}

/**
 * The core Weapon data structure used for damage calculations and rotation building.
 */
export interface Weapon extends BaseEntity {
  attributes: Record<RefineLevel, RefineProperties>;
  baseStats: Record<CharacterStat, number>;
}
