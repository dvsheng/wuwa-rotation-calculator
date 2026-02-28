import type { CharacterAttack, Enemy, Modifier, Team } from '@/types';

import type { CalculateDamageProperties } from '../damage-calculator/calculate-damage.types';

export interface Rotation {
  team: Team;
  enemy: Enemy;
  duration: number;
  attacks: Array<{
    attack: CharacterAttack;
    modifiers: Array<Modifier>;
  }>;
}

export interface RotationResult {
  totalDamage: number;
  damageDetails: Array<
    CalculateDamageProperties & { attackIndex: number; damage: number }
  >;
}

export const AttackScalingType = {
  REGULAR: 'regular',
  NEGATIVE_STATUS: 'negativeStatus',
  FIXED: 'fixed',
  TUNE_RUPTURE: 'tuneRupture',
};

export type AttackScalingType =
  (typeof AttackScalingType)[keyof typeof AttackScalingType];
