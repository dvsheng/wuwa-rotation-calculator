import type { CharacterDamageInstance, Enemy, Modifier, Team } from '@/types';

import type { CalculateDamageProperties } from './damage-calculator/types';

export interface Rotation {
  team: Team;
  enemy: Enemy;
  duration: number;
  damageInstances: Array<{
    instance: CharacterDamageInstance;
    modifiers: Array<Modifier>;
  }>;
}

export interface RotationResult {
  totalDamage: number;
  damageInstances: Array<number>;
  damageDetails: Array<{
    team: Team;
    enemy: Enemy;
    instance: CharacterDamageInstance;
    resolvedStats: CalculateDamageProperties;
  }>;
}

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
