import { deepTransform } from '@/lib/deepTransform';

import type { RefineScalableNumber } from './types';
import { Sequence } from './types';

export type ResolveRefineScalableNumber<T> = ReturnType<
  typeof resolveStoreNumberType<T>
>;

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

export const resolveStoreNumberType = <T>(data: T, refineLevel = 1) => {
  return deepTransform(
    data,
    isRefineScalableNumber,
    (value) => value.base + (refineLevel - 1) * value.increment,
  );
};

export type RecursivelyReplaceNullWithUndefined<T> = ReturnType<
  typeof replaceNullsWithUndefined<T>
>;

export const replaceNullsWithUndefined = <T>(data: T) => {
  return deepTransform(
    data,
    (value) => value === null,
    // eslint-disable-next-line unicorn/no-useless-undefined
    (_) => undefined,
  );
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
export const resolveAlternativeDefinitions = <T extends { capabilityJson: any }>(
  capability: T,
  sequence: number = 0,
): ResolveAlternativeDefinitions<T> => {
  const json = capability.capabilityJson;

  // Only attacks and modifiers have alternativeDefinitions
  if (!('alternativeDefinitions' in json)) {
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
  const nextDescription = override?.description;
  return {
    ...capability,
    ...('capabilityDescription' in capability
      ? {
          capabilityDescription: nextDescription ?? capability.capabilityDescription,
        }
      : {}),
    ...('description' in capability
      ? {
          description: nextDescription ?? capability.description,
        }
      : {}),
    capabilityJson: { ...baseJson, ...override },
  } as ResolveAlternativeDefinitions<T>;
};
