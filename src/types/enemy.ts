import { NegativeStatus } from './negative-status';
import type { RotationRuntimeResolvableNumber } from './parameterized-number';
import type { TaggedStatValue } from './tag';

export const EnemyStat = {
  BASE_RESISTANCE: 'baseResistance',
  RESISTANCE_REDUCTION: 'resistanceReduction',
  DEFENSE_REDUCTION: 'defenseReduction',
  ...NegativeStatus,
} as const;

export type EnemyStat = (typeof EnemyStat)[keyof typeof EnemyStat];

/**
 * Defines the stats of an enemy, primarily focusing on resistances and reductions.
 */
export type EnemyStats<T = RotationRuntimeResolvableNumber | number> = Record<
  EnemyStat,
  Array<TaggedStatValue<T>>
>;

/**
 * Represents an enemy target in the simulation.
 */
export interface Enemy {
  /** Progression level of the enemy. */
  level: number;
  /** Current defensive stats. */
  stats: EnemyStats;
}
