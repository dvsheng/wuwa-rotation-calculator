import type { CharacterStat } from './character';
import type { AbilityAttribute } from './damage-instance';
import type { EnemyStat } from './enemy';

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
}

/**
 * Defines a conditional bonus that adds a value when a parameter meets a threshold.
 * Evaluates as: IF(parameter <operator> threshold, valueIfTrue, valueIfFalse)
 */
export interface ConditionalBonus<T extends string> {
  /** The parameter key to check (e.g., '0', '1', '2' for user parameters). */
  parameter: T;
  /** The comparison operator. */
  operator: '>=' | '>' | '<=' | '<' | '==';
  /** The threshold value to compare against. */
  threshold: number;
  /** The value to add if the condition is true. */
  valueIfTrue: number;
  /** The value to add if the condition is false (defaults to 0). */
  valueIfFalse?: number;
}

export interface LinearParameterizedNumber<T extends string> {
  minimum?: number;
  maximum?: number;
  parameterConfigs: Partial<Record<T, LinearScalingParameterConfig>>;
  offset?: number;
  /** Optional array of conditional bonuses evaluated as step functions. */
  conditionals?: Array<ConditionalBonus<T>>;
}

/**
 * Represents a stat value that is dynamically calculated during rotation simulation.
 * Useful for effects that scale based on another stat (e.g., Energy Regen).
 */
export interface RotationRuntimeResolvableNumber extends LinearParameterizedNumber<
  CharacterStat | EnemyStat | AbilityAttribute
> {
  /**
   * The name of the character whose stats are used for resolution.
   */
  resolveWith: string;
}

export type UserParameterizedNumber = LinearParameterizedNumber<'0' | '1' | '2'>;

/**
 * Checks if a value is a UserParameterizedNumber.
 */
export const isUserParameterizedNumber = (
  val: unknown,
): val is UserParameterizedNumber => {
  return (
    typeof val === 'object' &&
    val !== null &&
    'parameterConfigs' in val &&
    !('resolveWith' in val)
  );
};

/**
 * Checks if a value is a RotationRuntimeResolvableNumber.
 */
export const isRotationRuntimeResolvableNumber = (
  val: unknown,
): val is RotationRuntimeResolvableNumber => {
  return (
    typeof val === 'object' &&
    val !== null &&
    'parameterConfigs' in val &&
    'resolveWith' in val
  );
};
