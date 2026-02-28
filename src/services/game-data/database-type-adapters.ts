import type { DatabaseFullCapability } from '@/db/schema';
import type {
  DatabasePureRotationRuntimeResolvableNumber,
  DatabasePureUserParameterizedResolvableNumber,
  DatabaseRefineScalableNumber,
  DatabaseRotationRuntimeResolvableNumber,
  DatabaseUserParameterizedResolvableNumber,
} from '@/schemas/database';
import type { UserParameterizedNumber } from '@/types/parameterized-number';

import type { GameDataRotationRuntimeResolvableNumber } from './types';
import { Sequence } from './types';

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
  T extends DatabasePureRotationRuntimeResolvableNumber
    ? GameDataRotationRuntimeResolvableNumber
    : T extends DatabasePureUserParameterizedResolvableNumber
      ? UserParameterizedNumber
      : T extends DatabaseRotationRuntimeResolvableNumber
        ? GameDataRotationRuntimeResolvableNumber
        : T extends DatabaseUserParameterizedResolvableNumber
          ? UserParameterizedNumber
          : T extends DatabaseRefineScalableNumber
            ? number
            : T extends number
              ? number
              : T extends object
                ? { [K in keyof T]: ResolveStoreNumberType<T[K]> }
                : T extends Array<infer U>
                  ? Array<ResolveStoreNumberType<U>>
                  : T;

/**
 * Runtime type guard to check if a value is a RefineScalableNumber.
 */
export const isRefineScalableNumber = (
  value: unknown,
): value is DatabaseRefineScalableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    'increment' in value &&
    typeof value.base === 'number' &&
    typeof value.increment === 'number'
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

export type RecursivelyReplaceNullWithUndefined<T> = T extends null
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

/**
 * Convert sequence string to number (e.g., 's1' -> 1, 's2' -> 2).
 */
export const sequenceToNumber = (sequence?: string): number => {
  if (!sequence) return 0;
  if (Object.values(Sequence).includes(sequence as Sequence)) {
    return Number.parseInt(sequence.slice(1), 10);
  }
  return 0;
};

/**
 * Get the highest applicable sequence from alternativeDefinitions.
 */
const getApplicableSequence = (
  alternativeDefinitions: Partial<Record<Sequence, unknown>> | undefined,
  sequence: number = 0,
): Sequence | undefined => {
  if (!alternativeDefinitions) return undefined;

  const applicableSequences = (Object.keys(alternativeDefinitions) as Array<Sequence>)
    .filter((seq) => sequenceToNumber(seq) <= sequence)
    .toSorted((a, b) => sequenceToNumber(b) - sequenceToNumber(a));

  return applicableSequences[0];
};

/**
 * Type helper to remove alternativeDefinitions from capabilityJson
 */
export type ResolveAlternativeDefinitions<T extends { capabilityJson: any }> =
  T extends {
    capabilityJson: infer J;
  }
    ? J extends { alternativeDefinitions?: any }
      ? Omit<T, 'capabilityJson'> & {
          capabilityJson: Omit<J, 'alternativeDefinitions'>;
        }
      : T
    : T;

/**
 * Resolve a capability by merging the highest applicable alternativeDefinition.
 * AlternativeDefinitions are now nested in capabilityJson.
 * Returns the capability without alternativeDefinitions, with override fields merged in.
 */
export const resolveAlternativeDefinitions = <T extends DatabaseFullCapability>(
  capability: T,
  sequence: number = 0,
): ResolveAlternativeDefinitions<T> => {
  const json = capability.capabilityJson;

  // Only attacks and modifiers have alternativeDefinitions
  if (!('alternativeDefinitions' in json) || !json.alternativeDefinitions) {
    return capability as ResolveAlternativeDefinitions<T>;
  }

  const applicableSeq = getApplicableSequence(json.alternativeDefinitions, sequence);

  if (!applicableSeq) {
    // No applicable sequence, just remove alternativeDefinitions
    const { alternativeDefinitions, ...baseJson } = json;
    return {
      ...capability,
      capabilityJson: baseJson,
    } as ResolveAlternativeDefinitions<T>;
  }

  // Merge override into base and remove alternativeDefinitions
  const override = json.alternativeDefinitions[applicableSeq];
  const { alternativeDefinitions, ...baseJson } = json;

  return {
    ...capability,
    capabilityDescription: override?.description ?? capability.capabilityDescription,
    capabilityJson: { ...baseJson, ...override },
  } as ResolveAlternativeDefinitions<T>;
};
