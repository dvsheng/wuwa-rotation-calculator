import type {
  AttackScalingProperty,
  CharacterAttack,
  CharacterStats,
  Enemy,
  EnemyStats,
  Modifier,
  Team,
} from '@/types';

import type { CalculateDamageProperties } from '../damage-calculator/calculate-damage.types';

export interface Rotation<T extends {} = {}> {
  team: Team<T>;
  enemy: Enemy<T>;
  duration: number;
  attacks: Array<{
    attack: CharacterAttack;
    modifiers: Array<Modifier<T>>;
  }>;
}

export interface RotationResult<T extends {} = {}> {
  totalDamage: number;
  damageDetails: Array<
    CalculateDamageProperties & {
      attackIndex: number;
      damageInstanceIndex: number;
      /** Index of the character in the team (0–2) that dealt this damage. */
      characterIndex: number;
      scalingStat: AttackScalingProperty;
      motionValue: number;
      damage: number;
      teamDetails: Array<CharacterStats<T>>;
      enemyDetails: EnemyStats<T>;
    }
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
