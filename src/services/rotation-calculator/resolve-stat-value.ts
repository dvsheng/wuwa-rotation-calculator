import { sumBy } from 'es-toolkit/math';
import { mapValues } from 'es-toolkit/object';

import { calculateParameterizedNumberValue } from '@/services/rotation-calculator/calculate-parameterized-number';
import type { Enemy, RotationRuntimeResolvableNumber, Team } from '@/types';

/**
 * Converts runtime-resolvable number types to plain numbers.
 * Works with union types, arrays, and objects (recursively).
 *
 * - RotationRuntimeResolvableNumber → number
 * - Array<RotationRuntimeResolvableNumber> → Array<number>
 * - Objects with RotationRuntimeResolvableNumber → Objects with number (recursive)
 * - number → number (passthrough)
 *
 * @example
 * type Input = number | RotationRuntimeResolvableNumber;
 * type Output = ResolveRuntimeStatType<Input>;
 * // Output: number
 *
 * @example
 * type ArrayInput = Array<{ value: number | RotationRuntimeResolvableNumber }>;
 * type ArrayOutput = ResolveRuntimeStatType<ArrayInput>;
 * // Output: Array<{ value: number }>
 *
 * @example
 * type ModifierInput = {
 *   modifiedStats: {
 *     criticalDamage: Array<{ value: RotationRuntimeResolvableNumber }>;
 *   };
 * };
 * type ModifierOutput = ResolveRuntimeStatType<ModifierInput>;
 * // Output: { modifiedStats: { criticalDamage: Array<{ value: number }> } }
 */
export type ResolveRuntimeStatType<T> =
  T extends Array<infer U>
    ? Array<ResolveRuntimeStatType<U>>
    : T extends RotationRuntimeResolvableNumber
      ? number
      : T extends number
        ? number
        : T extends object
          ? { [K in keyof T]: ResolveRuntimeStatType<T[K]> }
          : T;

/**
 * Runtime type guard to check if a value is a RotationRuntimeResolvableNumber.
 */
export const isRotationRuntimeResolvableNumber = (
  value: unknown,
): value is RotationRuntimeResolvableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'resolveWith' in value &&
    'parameterConfigs' in value &&
    typeof (value as RotationRuntimeResolvableNumber).resolveWith === 'number'
  );
};

/**
 * Creates a curried function that resolves RotationRuntimeResolvableNumber values to plain numbers.
 * Similar to resolveStoreNumberType, but uses team/enemy stats instead of refine level.
 *
 * - Converts `RotationRuntimeResolvableNumber` → `number` using character/enemy stats
 * - Recursively processes arrays and objects
 * - Preserves structure while resolving nested runtime-resolvable numbers
 *
 * @param team - The team with character stats to use for resolution
 * @param enemy - The enemy with stats to use for resolution
 * @returns A function that resolves runtime-resolvable numbers in any data structure
 *
 * @example
 * const resolver = createRuntimeStatResolver(team, enemy);
 * const resolvedValue = resolver(statValue);
 * // If statValue is a RotationRuntimeResolvableNumber, it's resolved to a number
 * // If it's already a number, it's returned as-is
 *
 * @example
 * const resolver = createRuntimeStatResolver(team, enemy);
 * const modifier = { modifiedStats: { criticalDamage: [{ value: runtimeResolvable }] } };
 * const resolved = resolver(modifier);
 * // All nested runtime-resolvable values are resolved
 */
export function createRuntimeStatResolver(team: Team, enemy: Enemy) {
  const teamStats = team.map((character) =>
    mapValues(character.stats, (statValues) => {
      return sumBy(statValues, (statValue) =>
        typeof statValue.value === 'number' ? statValue.value : 0,
      );
    }),
  );
  const enemyStats = mapValues(enemy.stats, (statValues) => {
    return sumBy(statValues, (statValue) =>
      typeof statValue.value === 'number' ? statValue.value : 0,
    );
  });

  return function resolveRuntimeStats<T>(value: T): ResolveRuntimeStatType<T> {
    // Handle RotationRuntimeResolvableNumber - resolve to plain number
    if (isRotationRuntimeResolvableNumber(value)) {
      const characterStats = teamStats[value.resolveWith];
      const resolved = calculateParameterizedNumberValue(value, {
        ...characterStats,
        ...enemyStats,
      });
      return resolved as ResolveRuntimeStatType<T>;
    }

    // Handle arrays recursively
    if (Array.isArray(value)) {
      const resolvedArray = value.map((item) => resolveRuntimeStats(item));
      return resolvedArray as ResolveRuntimeStatType<T>;
    }

    // Handle objects recursively
    if (typeof value === 'object' && value !== null) {
      const resolved: Record<string, unknown> = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        resolved[key] = resolveRuntimeStats(nestedValue);
      }
      return resolved as ResolveRuntimeStatType<T>;
    }

    // Pass through primitives (numbers, strings, booleans, null, undefined)
    return value as ResolveRuntimeStatType<T>;
  };
}
