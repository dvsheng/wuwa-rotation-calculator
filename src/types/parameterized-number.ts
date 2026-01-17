import type { CharacterStat } from './server/character';
import type { AbilityAttribute } from './server/damage-instance';
import type { EnemyStat } from './server/enemy';

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
  offset?: number;
}

export interface LinearParameterizedNumber<T extends string | number> {
  minimum?: number;
  maximum?: number;
  parameterConfigs: Partial<Record<T, LinearScalingParameterConfig>>;
  offset?: number;
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

export type UserParameterizedNumber = LinearParameterizedNumber<number>;
