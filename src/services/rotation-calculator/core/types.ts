import type { CalculateDamageProperties } from '@/services/rotation-calculator/damage-calculator';
import type { AttackScalingProperty, CharacterStat, EnemyStat, Tag } from '@/types';

import type { NumberNode } from './resolve-runtime-number';

export type Stat<TMeta extends {} = {}> = {
  stat: CharacterStat | EnemyStat;
  value: NumberNode;
  tags: Array<string>;
} & TMeta;

export type Modifier<TMeta extends {} = {}> = Stat<TMeta> & {
  targets: Array<number | 'enemy'>;
};

export type Attack<TMeta extends {} = {}> = TMeta & {
  /** The index of the character performing the attack */
  characterIndex: number;
  /** The motion value of the attack */
  motionValue: number;
  /** The stat the attack scales on */
  scalingStat: AttackScalingProperty;
  /** Any tags attached to the attack */
  tags: Array<Tag>;
};
export interface Character<TMeta extends {} = {}> {
  level: number;
  stats: Array<Stat<TMeta>>;
}

export type Enemy<TMeta extends {} = {}> = Character<TMeta>;

/**
 * A standard three-character team composition.
 */
export type Team<T extends {} = {}> = Array<Character<T>>;

export interface Rotation<TStatMeta extends {} = {}, TAttackMeta extends {} = {}> {
  team: Array<Character<TStatMeta>>;
  enemy: Enemy<TStatMeta>;
  duration: number;
  attacks: Array<{
    attack: Attack<TAttackMeta>;
    modifiers: Array<Modifier<TStatMeta>>;
  }>;
}

/**
 * A comprehensive record of a character's stats, where each value is an array of tagged instances
 * to allow for conditional application during damage calculations.
 */
export type CharacterStats<T extends {} = {}> = Record<CharacterStat, Array<Stat<T>>>;

export type EnemyStats<T extends {} = {}> = Record<EnemyStat, Array<Stat<T>>>;

export interface RotationResult<
  TStatMeta extends {} = {},
  TAttackMeta extends {} = {},
> {
  totalDamage: number;
  damageDetails: Array<
    CalculateDamageProperties &
      Attack<TAttackMeta> & {
        index: number;
        damage: number;
        teamDetails: Array<CharacterStats<TStatMeta>>;
        enemyDetails: EnemyStats<TStatMeta>;
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
