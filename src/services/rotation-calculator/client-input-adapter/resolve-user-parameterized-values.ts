import type { DatabaseUserParameterizedNumberNode } from '@/schemas/database';
import type { ParameterInstance } from '@/schemas/rotation';
import type { GameDataUserNumber } from '@/services/game-data';

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
  // convert first (before object recursion)
  T extends GameDataUserNumber
    ? number
    : T extends number
      ? number
      : T extends Array<infer U>
        ? Array<ResolveUserParameterizedType<U>>
        : T extends object
          ? { [K in keyof T]: ResolveUserParameterizedType<T[K]> }
          : T;

/**
 * Type guard for userParameterizedNumber nodes in the GameDataNumberNode format.
 */
const isUserParameterizedNode = (
  value: unknown,
): value is DatabaseUserParameterizedNumberNode =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as Record<string, unknown>).type === 'userParameterizedNumber' &&
  'parameterId' in value;

/**
 * Resolves userParameterizedNumber nodes in a GameDataNumberNode tree to plain numbers
 * using parameterValues from the enclosing rotation action or modifier.
 *
 * - Converts `{ type: 'userParameterizedNumber', parameterId }` → `number`
 * - Recursively processes arrays and objects
 * - Preserves all other node types (sum, product, clamp, conditional, statParameterizedNumber)
 * - Throws if a userParameterizedNumber is encountered without parameterValues in any parent
 *
 * @param value - The value to resolve (may contain userParameterizedNumber nodes)
 * @param currentParameterValues - Parameter values from the current or parent scope
 * @returns The resolved value with all userParameterizedNumber nodes converted to numbers
 */

export function resolveUserParameterizedValues<T>(
  value: T,
  currentParameterValues?: Record<string, number>,
): ResolveUserParameterizedType<T> {
  // Handle userParameterizedNumber node - resolve to plain number
  if (isUserParameterizedNode(value)) {
    if (!currentParameterValues) {
      throw new Error(
        'Encountered userParameterizedNumber without parameterValues in any parent object',
      );
    }
    return (currentParameterValues[value.parameterId] *
      (value.scale ?? 1)) as ResolveUserParameterizedType<T>;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveUserParameterizedValues(item, currentParameterValues),
    ) as ResolveUserParameterizedType<T>;
  }

  // Handle objects recursively
  if (typeof value === 'object' && value !== null) {
    const object = value as Record<string, unknown>;

    // Check if this object has a parameterValues field
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
      if (key === 'parameterValues') continue;
      resolved[key] = resolveUserParameterizedValues(nestedValue, parameterValues);
    }
    return resolved as ResolveUserParameterizedType<T>;
  }

  // Pass through primitives (numbers, strings, booleans, null, undefined)
  return value as ResolveUserParameterizedType<T>;
}
