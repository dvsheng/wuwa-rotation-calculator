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
export const resolveUserParameterizedValues = <T>(
  data: T,
  parameterValues?: Partial<Record<string, number>>,
) => {
  return deepTransform(data, isResolvedUserParameterizedNumber, (value) => {
    const parameterValue = parameterValues?.[value.parameterId];
    if (!parameterValue) {
      throw new Error(
        'Encountered userParameterizedNumber without parameterValues in any parent object',
      );
    }
    const minimum = value.minimum ?? Number.NEGATIVE_INFINITY;
    const maximum = value.maximum ?? Number.POSITIVE_INFINITY;
    return clamp(parameterValue, minimum, maximum) * (value.scale ?? 1);
  });
};
