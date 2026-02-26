import type {
  CharacterDamageInstance,
  Enemy,
  Modifier,
  NegativeStatus,
  Team,
} from '@/types';

import type { CalculateDamageProperties } from '../damage-calculator/calculate-damage.types';

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
    instance: CharacterDamageInstance;
    resolvedStats: Omit<CalculateDamageProperties, 'skill'> & {
      skill: {
        motionValue?: number;
        negativeStatus?: NegativeStatus;
      };
    };
  }>;
}

export const AttackScalingType = {
  REGULAR: 'regular',
  NEGATIVE_STATUS: 'negativeStatus',
  FIXED: 'fixed',
};

export type AttackScalingType =
  (typeof AttackScalingType)[keyof typeof AttackScalingType];
