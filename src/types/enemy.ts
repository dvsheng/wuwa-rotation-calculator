import { NegativeStatus } from './negative-status';

/**
 * A stat belonging to an enemy
 */
export const EnemyStat = {
  BASE_RESISTANCE: 'baseResistance',
  RESISTANCE_REDUCTION: 'resistanceReduction',
  DEFENSE_REDUCTION: 'defenseReduction',
  TUNE_STRAIN_STACKS: 'tuneStrainStacks',
  ...NegativeStatus,
} as const;

export type EnemyStat = (typeof EnemyStat)[keyof typeof EnemyStat];
