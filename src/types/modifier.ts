import type { CharacterStats } from './character';
import type { EnemyStats } from './enemy';
import type { RotationRuntimeResolvableNumber } from './parameterized-number';

/**
 * Refers to a specific character slot index (0, 1, or 2) in the team.
 */
export type CharacterSlotNumber = 0 | 1 | 2;

/**
 * Represents a temporary or conditional modification to character stats.
 */
export interface CharacterModifier<T = RotationRuntimeResolvableNumber | number> {
  /** Group or slots affected by this modifier. */
  targets: Array<CharacterSlotNumber>;
  /** Collection of stats to modify. */
  modifiedStats: Partial<CharacterStats<T>>;
}

/**
 * Represents a temporary or conditional modification to enemy stats.
 */
export interface EnemyModifier<T = RotationRuntimeResolvableNumber | number> {
  /** Collection of enemy stats to modify. */
  modifiedStats: Partial<EnemyStats<T>>;
}

/**
 * A union type for all possible simulation modifiers.
 */
export type Modifier<T = RotationRuntimeResolvableNumber | number> =
  | CharacterModifier<T>
  | EnemyModifier<T>;

export const isCharacterModifier = <T>(
  modifier: Modifier<T>,
): modifier is CharacterModifier<T> => {
  return 'targets' in modifier;
};
