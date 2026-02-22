import type { ModifierInstance } from '@/schemas/rotation';

/**
 * Expands a modifier instance with per-stack value configurations into multiple individual
 * modifier instances, each covering exactly one attack (w=1).
 *
 * When a buff spans multiple attacks (w > 1) and a parameter has a `valueConfiguration`
 * array, the user has specified distinct parameter values for each attack the buff covers.
 * This function "unwraps" that into one modifier per attack, each with a single `value`.
 *
 * For parameters that do NOT have `valueConfiguration`, their `value` is copied as-is to
 * every expanded modifier.
 *
 * If no parameter carries a `valueConfiguration`, the modifier is returned unchanged in a
 * single-element array.
 *
 * @example
 * // Buff with w=3 starting at x=2, one parameter configured per-stack
 * expandModifiersByValueConfiguration({
 *   x: 2, w: 3,
 *   parameterValues: [{ id: '0', value: 10, valueConfiguration: [10, 20, 30] }],
 * });
 * // →
 * [
 *   { x: 2, w: 1, parameterValues: [{ id: '0', value: 10 }] },
 *   { x: 3, w: 1, parameterValues: [{ id: '0', value: 20 }] },
 *   { x: 4, w: 1, parameterValues: [{ id: '0', value: 30 }] },
 * ]
 */
export const expandModifiersByValueConfiguration = (
  modifier: ModifierInstance,
): Array<ModifierInstance> => {
  const hasValueConfiguration =
    modifier.parameterValues?.some(
      (p) => p.valueConfiguration && p.valueConfiguration.length > 0,
    ) ?? false;

  if (!hasValueConfiguration) return [modifier];

  return Array.from({ length: modifier.w }, (_, stackIndex) => ({
    ...modifier,
    x: modifier.x + stackIndex,
    w: 1,
    parameterValues: modifier.parameterValues?.map((p) => ({
      id: p.id,
      value: p.valueConfiguration ? p.valueConfiguration[stackIndex] : p.value,
    })),
  }));
};
