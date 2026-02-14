import type { UserParameterizedNumber } from '@/types/parameterized-number';

import type {
  RefineScalableNumber,
  StoreParameterizedNumber,
  StoreRotationRuntimeResolvableNumber,
} from '../../db/schema';

import type { GameDataRotationRuntimeResolvableNumber } from './types';

/**
 * Converts Store number types to runtime number types.
 * Works with union types, arrays, and objects (recursively).
 *
 * - StoreNumber (number | RefineScalableNumber) → number
 * - StoreParameterizedNumber → UserParameterizedNumber
 * - StoreRotationRuntimeResolvableNumber → RotationRuntimeResolvableNumber
 * - Array<Store types> → Array<runtime types>
 * - Objects with Store types → Objects with runtime types (recursive)
 * - number → number (passthrough)
 *
 * @example
 * type Input = StoreNumber | StoreParameterizedNumber;
 * type Output = ResolveStoreNumberType<Input>;
 * // Output: number | UserParameterizedNumber
 *
 * @example
 * type ArrayInput = Array<StoreNumber | StoreParameterizedNumber>;
 * type ArrayOutput = ResolveStoreNumberType<ArrayInput>;
 * // Output: Array<number | UserParameterizedNumber>
 *
 * @example
 * type ObjectInput = { min: StoreNumber; max: StoreNumber };
 * type ObjectOutput = ResolveStoreNumberType<ObjectInput>;
 * // Output: { min: number; max: number }
 */
export type ResolveStoreNumberType<T> =
  T extends Array<infer U>
    ? Array<ResolveStoreNumberType<U>>
    : T extends StoreRotationRuntimeResolvableNumber
      ? GameDataRotationRuntimeResolvableNumber
      : T extends StoreParameterizedNumber
        ? UserParameterizedNumber
        : T extends RefineScalableNumber
          ? number
          : T extends number
            ? number
            : T extends object
              ? { [K in keyof T]: ResolveStoreNumberType<T[K]> }
              : T;

/**
 * Runtime type guard to check if a value is a RefineScalableNumber.
 */
export const isRefineScalableNumber = (
  value: unknown,
): value is RefineScalableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    'increment' in value &&
    typeof (value as RefineScalableNumber).base === 'number' &&
    typeof (value as RefineScalableNumber).increment === 'number'
  );
};

/**
 * Recursively resolves RefineScalableNumber to plain numbers in Store types.
 * This runtime function implements the ResolveStoreNumberType utility type.
 *
 * - Converts `RefineScalableNumber` → `number` using: `base + (refineLevel - 1) * increment`
 * - Recursively processes arrays and objects
 * - Preserves structure of parameterized numbers while resolving nested RefineScalableNumber
 *
 * @param value - The value to resolve (can be Store types or regular types)
 * @param refineLevel - Weapon refinement level (1-5) for resolving RefineScalableNumber
 * @returns The resolved value with all RefineScalableNumber instances converted to numbers
 *
 * @example
 * const storeValue: StoreNumber = { base: 10, increment: 2 };
 * const resolved = resolveStoreNumberType(storeValue, 5);
 * // Result: 18 (10 + (5-1) * 2 = 18)
 *
 * @example
 * const storeParam: StoreParameterizedNumber = {
 *   offset: { base: 5, increment: 1 },
 *   parameterConfigs: { '0': { scale: 2 } }
 * };
 * const resolved = resolveStoreNumberType(storeParam, 3);
 * // Result: { offset: 7, parameterConfigs: { '0': { scale: 2 } } }
 *
 * @example
 * const motionValues: Array<StoreNumber> = [{ base: 10, increment: 2 }, 100];
 * const resolved = resolveStoreNumberType(motionValues, 5);
 * // Result: [18, 100]
 */
export function resolveStoreNumberType<T>(
  value: T,
  refineLevel = 1,
): ResolveStoreNumberType<T> {
  // Handle RefineScalableNumber - resolve to plain number
  if (isRefineScalableNumber(value)) {
    const resolved = value.base + (refineLevel - 1) * value.increment;
    return resolved as ResolveStoreNumberType<T>;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    const resolvedArray = value.map((item) =>
      resolveStoreNumberType(item, refineLevel),
    );
    return resolvedArray as ResolveStoreNumberType<T>;
  }

  // Handle objects recursively (parameterized numbers, modifiers, etc.)
  if (typeof value === 'object' && value !== null) {
    const resolved: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      resolved[key] = resolveStoreNumberType(nestedValue, refineLevel);
    }
    return resolved as ResolveStoreNumberType<T>;
  }

  // Pass through primitives (numbers, strings, booleans, null, undefined)
  return value as ResolveStoreNumberType<T>;
}

type RecursivelyReplaceNullWithUndefined<T> = T extends null
  ? undefined
  : T extends Date
    ? T
    : {
        [K in keyof T]: T[K] extends Array<infer U>
          ? Array<RecursivelyReplaceNullWithUndefined<U>>
          : RecursivelyReplaceNullWithUndefined<T[K]>;
      };

export const replaceNullsWithUndefined = <T>(
  object: T,
): RecursivelyReplaceNullWithUndefined<T> => {
  if (object === null) {
    return undefined as any;
  }

  // object check based on: https://stackoverflow.com/a/51458052/6489012
  if (object?.constructor.name === 'Object') {
    for (const key in object) {
      object[key] = replaceNullsWithUndefined(object[key]) as any;
    }
  }
  return object as any;
};
