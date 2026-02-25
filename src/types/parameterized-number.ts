import type { CharacterStat } from './character';
import type { AttackScalingProperty } from './damage-instance';
import type { EnemyStat } from './enemy';

export interface LinearParameterizedNumber<T extends string> {
  minimum?: number;
  maximum?: number;
  parameterConfigs: Partial<Record<T, LinearScalingParameterConfig>>;
  offset?: number;
}

/**
 * Defines the parameters for a linear scaling calculation:
 * value = scale * (baseStat - minimum)
 */
export interface LinearScalingParameterConfig {
  /** The ratio applied to the excess stat value. */
  scale: number;
  /** The value of the source stat at which scaling begins. */
  minimum?: number;
  /** The value of the source stat at which scaling ends. */
  maximum?: number;
  /** Optional conditional bonuses evaluated as step functions. */
  conditionalConfiguration?: {
    /** The comparison operator. */
    operator: '>=' | '>' | '<=' | '<' | '==';
    /** The threshold value to compare against. */
    threshold: number;
    /** The value to add if the condition is true. */
    valueIfTrue: number;
    /** The value to add if the condition is false (defaults to 0). */
    valueIfFalse?: number;
  };
}

/**
 * Represents a stat value that is dynamically calculated during rotation simulation.
 * Useful for effects that scale based on another stat (e.g., Energy Regen).
 */
export interface RotationRuntimeResolvableNumber extends LinearParameterizedNumber<
  CharacterStat | EnemyStat | AttackScalingProperty
> {
  /**
   * The name of the character whose stats are used for resolution.
   */
  resolveWith: 0 | 1 | 2;
}

export type UserParameterizedNumber = LinearParameterizedNumber<'0' | '1' | '2'>;

/**
 * Checks if a value is a UserParameterizedNumber.
 */
export const isUserParameterizedNumber = (
  value: unknown,
): value is UserParameterizedNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'parameterConfigs' in value &&
    !('resolveWith' in value)
  );
};

/**
 * Checks if a value is a RotationRuntimeResolvableNumber.
 */
export const isRotationRuntimeResolvableNumber = (
  value: unknown,
): value is RotationRuntimeResolvableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'parameterConfigs' in value &&
    'resolveWith' in value
  );
};
