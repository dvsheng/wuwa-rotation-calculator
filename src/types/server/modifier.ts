import { isUserParameterizedNumber } from '../parameterized-number';
import type {
  RotationRuntimeResolvableNumber,
  UserParameterizedNumber,
} from '../parameterized-number';

import type { CharacterStats } from './character';
import type { EnemyStats } from './enemy';

/**
 * Defines the potential targets for a modifier.
 */
export const Target = {
  /** Applies to all characters in the current team. */
  TEAM: 'team',
  /** Applies to the enemy target. */
  ENEMY: 'enemy',
  /** Applies only to the character currently on field. */
  ACTIVE_CHARACTER: 'activeCharacter',
  SELF: 'self',
} as const;

export type TargetEnum = (typeof Target)[keyof typeof Target];

/**
 * Refers to a specific character slot (1, 2, or 3) in the team.
 */
export type CharacterSlotNumber = 1 | 2 | 3;

/**
 * A modifier's target can be a predefined group or a specific set of character slots.
 */
export type Target = TargetEnum | Array<CharacterSlotNumber>;

/**
 * Represents a temporary or conditional modification to character stats.
 */
export interface CharacterModifier<T = RotationRuntimeResolvableNumber | number> {
  /** Group or slots affected by this modifier. */
  target: Exclude<Target, 'enemy'>;
  /** Collection of stats to modify. */
  modifiedStats: Partial<CharacterStats<T>>;
}

/**
 * Represents a temporary or conditional modification to enemy stats.
 */
export interface EnemyModifier<T = RotationRuntimeResolvableNumber | number> {
  /** Targets the enemy. */
  target: 'enemy';
  /** Collection of enemy stats to modify. */
  modifiedStats: Partial<EnemyStats<T>>;
}

/**
 * A union type for all possible simulation modifiers.
 */
export type Modifier<T = RotationRuntimeResolvableNumber | number> =
  | CharacterModifier<T>
  | EnemyModifier<T>;

/**
 * Helper to check if a modifier has any stats that are parameterized by the user.
 */
export const isUserParameterizedModifier = (modifier: Modifier<any>): boolean => {
  const modifiedStats = modifier.modifiedStats;
  return Object.values(modifiedStats).some((statValues) => {
    return (statValues as Array<any>).some((sv) => isUserParameterizedNumber(sv.value));
  });
};

/**
 * Extracts all UserParameterizedNumbers found within a modifier's stats.
 */
export const extractUserParameters = (
  modifier: Modifier<any>,
): Array<UserParameterizedNumber> => {
  const modifiedStats = modifier.modifiedStats;
  const params: Array<UserParameterizedNumber> = [];
  Object.values(modifiedStats).forEach((statValues) => {
    (statValues as Array<any>).forEach((sv) => {
      if (isUserParameterizedNumber(sv.value)) {
        params.push(sv.value);
      }
    });
  });
  return params;
};
