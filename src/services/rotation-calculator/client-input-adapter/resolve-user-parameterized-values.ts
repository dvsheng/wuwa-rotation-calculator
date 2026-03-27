import { clamp } from 'es-toolkit';

import { deepTransform } from '@/lib/deepTransform';
import { isResolvedUserParameterizedNumber } from '@/services/game-data';

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
export type ResolveUserParameterizedType<T> = ReturnType<
  typeof resolveUserParameterizedValues<T>
>;

/**
 * Resolves userParameterizedNumber nodes in a GameDataNumberNode tree to plain numbers
 * using parameter values provided directly by the caller.
 *
 * - Converts `{ type: 'userParameterizedNumber', parameterId }` → `number`
 * - Recursively processes arrays and objects
 * - Preserves all other node types (sum, product, clamp, conditional, statParameterizedNumber)
 * - Throws if a userParameterizedNumber is encountered without a matching value
 *
 * @param value - The value to resolve (may contain userParameterizedNumber nodes)
 * @param parameterValues - Parameter values keyed by parameter ID
 * @returns The resolved value with all userParameterizedNumber nodes converted to numbers
 */
export const resolveUserParameterizedValues = <T>(
  data: T,
  parameterValues?: Partial<Record<string, number>>,
) => {
  return deepTransform(data, isResolvedUserParameterizedNumber, (value) => {
    const parameterValue = parameterValues?.[value.parameterId];
    if (parameterValue === undefined) {
      throw new Error(
        'Encountered userParameterizedNumber without matching parameterValues',
      );
    }
    const minimum = value.minimum ?? Number.NEGATIVE_INFINITY;
    const maximum = value.maximum ?? Number.POSITIVE_INFINITY;
    return clamp(parameterValue, minimum, maximum) * (value.scale ?? 1);
  });
};
