import { NegativeStatus } from './negative-status';
import type { TaggedStatValue } from './tag';

export const EnemyStat = {
  BASE_RESISTANCE: 'baseResistance',
  RESISTANCE_REDUCTION: 'resistanceReduction',
  DEFENSE_REDUCTION: 'defenseReduction',
  TUNE_STRAIN_STACKS: 'tuneStrainStacks',
  ...NegativeStatus,
} as const;

export type EnemyStat = (typeof EnemyStat)[keyof typeof EnemyStat];

/**
 * Defines the stats of an enemy, primarily focusing on resistances and reductions.
 */
export type EnemyStats = Record<EnemyStat, Array<TaggedStatValue>>;

/**
 * Represents an enemy target in the simulation.
 */
export interface Enemy {
  /** Progression level of the enemy. */
  level: number;
  /** Current defensive stats. */
  stats: EnemyStats;
}
