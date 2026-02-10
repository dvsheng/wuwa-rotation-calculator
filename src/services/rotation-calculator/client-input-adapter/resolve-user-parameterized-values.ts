import type { ParameterInstance } from '@/schemas/rotation';
import { calculateParameterizedNumberValue } from '@/services/rotation-calculator/core/calculate-parameterized-number';
import type { UserParameterizedNumber } from '@/types';
import { isUserParameterizedNumber } from '@/types';

/**
 * Converts user-parameterized number types to plain numbers.
 * Works with union types, arrays, and objects (recursively).
 *
 * - UserParameterizedNumber → number
 * - Array<UserParameterizedNumber> → Array<number>
 * - Objects with UserParameterizedNumber → Objects with number (recursive)
 * - number → number (passthrough)
 *
 * @example
 * type Input = number | UserParameterizedNumber;
 * type Output = ResolveUserParameterizedType<Input>;
 * // Output: number
 *
 * @example
 * type ArrayInput = Array<{ value: number | UserParameterizedNumber }>;
 * type ArrayOutput = ResolveUserParameterizedType<ArrayInput>;
 * // Output: Array<{ value: number }>
 *
 * @example
 * type ModifierInput = {
 *   modifiedStats: Array<{ value: UserParameterizedNumber }>;
 * };
 * type ModifierOutput = ResolveUserParameterizedType<ModifierInput>;
 * // Output: { modifiedStats: Array<{ value: number }> }
 */
export type ResolveUserParameterizedType<T> =
  T extends Array<infer U>
    ? Array<ResolveUserParameterizedType<U>>
    : T extends UserParameterizedNumber
      ? number
      : T extends number
        ? number
        : T extends object
          ? { [K in keyof T]: ResolveUserParameterizedType<T[K]> }
          : T;

/**
 * Resolves UserParameterizedNumber values to plain numbers by looking for parameterValues
 * in the object hierarchy.
 *
 * - Converts `UserParameterizedNumber` → `number` using parameterValues from closest parent
 * - Recursively processes arrays and objects
 * - Preserves structure while resolving nested user-parameterized numbers
 * - Throws an error if a UserParameterizedNumber is encountered without parameterValues in any parent
 *
 * @param value - The value to resolve (can contain UserParameterizedNumber)
 * @param currentParameterValues - Parameter values from the current or parent scope
 * @returns The resolved value with all UserParameterizedNumber instances converted to numbers
 *
 * @example
 * const attack = {
 *   motionValues: [userParameterized1, 100, userParameterized2],
 *   parameterValues: [{ id: '0', value: 50 }]
 * };
 * const resolved = resolveUserParameterizedValues(attack);
 * // All UserParameterizedNumber in motionValues are resolved using parameterValues
 *
 * @example
 * const modifier = {
 *   modifiedStats: [{ value: userParameterized }],
 *   parameterValues: [{ id: '0', value: 100 }]
 * };
 * const resolved = resolveUserParameterizedValues(modifier);
 * // UserParameterizedNumber in modifiedStats.value is resolved
 */
export function resolveUserParameterizedValues<T>(
  value: T,
  currentParameterValues?: Record<string, number>,
): ResolveUserParameterizedType<T> {
  // Handle UserParameterizedNumber - resolve to plain number
  if (isUserParameterizedNumber(value)) {
    if (!currentParameterValues) {
      throw new Error(
        'Encountered UserParameterizedNumber without parameterValues in any parent object',
      );
    }
    const resolved = calculateParameterizedNumberValue(value, currentParameterValues);
    return resolved as ResolveUserParameterizedType<T>;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    const resolvedArray = value.map((item) =>
      resolveUserParameterizedValues(item, currentParameterValues),
    );
    return resolvedArray as ResolveUserParameterizedType<T>;
  }

  // Handle objects recursively
  if (typeof value === 'object' && value !== null) {
    const object = value as Record<string, unknown>;

    // Check if this object has parameterValues field
    let parameterValues = currentParameterValues;
    if ('parameterValues' in object && Array.isArray(object.parameterValues)) {
      parameterValues = Object.fromEntries(
        (object.parameterValues as Array<ParameterInstance>).map((parameter) => [
          parameter.id,
          parameter.value,
        ]),
      ) as Record<string, number>;
    }

    const resolved: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(object)) {
      // Skip the parameterValues field itself in the output
      if (key === 'parameterValues') {
        continue;
      }
      resolved[key] = resolveUserParameterizedValues(nestedValue, parameterValues);
    }
    return resolved as ResolveUserParameterizedType<T>;
  }

  // Pass through primitives (numbers, strings, booleans, null, undefined)
  return value as ResolveUserParameterizedType<T>;
}
