import { compact, sortBy } from 'es-toolkit';

import type { Sequence } from '@/services/game-data/types';

import type { DamageInstance } from '../damage-instances/types';
import type { Damage } from '../repostiory';

export type DamageInstanceWithAlternativeDefinitions = DamageInstance & {
  alternativeDefinitions: Partial<Record<Sequence, DamageInstance>>;
};

export type SequenceMultipliers = Array<{ value: number; sequence: Sequence }>;

type DamageWithMaybeInstance = { raw: Damage; damageInstance?: DamageInstance };

const ALTERNATIVE_MULTIPLIER_TOLERANCE = 0.01;

/**
 * Infers alternative definitions for Damage rows based on the characters sequence multipliers
 *
 * Sequneces often have descriptions such as "Increase the damage multiplier of X attack by Y%"
 * However, attacks are typically comprised of multiple damage instances, and there will generally be
 * two damage rows, once with normal motion values, and another where the motion values are increased by Y%.
 * @param damages
 * @param options
 * @returns
 */
export const inferAlternativeDefinitions = (
  damages: Array<DamageWithMaybeInstance>,
  sequenceMultipliers: SequenceMultipliers,
): Array<DamageInstanceWithAlternativeDefinitions> => {
  const inferredById = new Map<number, DamageInstanceWithAlternativeDefinitions>();

  for (const inferred of inferFromInstanceConditions(damages, sequenceMultipliers)) {
    inferredById.set(inferred.id, inferred);
  }

  for (const inferred of inferFromSequenceMultipliers(damages, sequenceMultipliers)) {
    if (!inferredById.has(inferred.id)) {
      inferredById.set(inferred.id, inferred);
    }
  }
  return [...inferredById.values()].toSorted((left, right) => left.id - right.id);
};

const inferFromInstanceConditions = (
  damages: Array<DamageWithMaybeInstance>,
  sequnceMultipliers: Array<{ value: number; sequence: Sequence }>,
): Array<DamageInstanceWithAlternativeDefinitions> => {
  const damageById = new Map(damages.map((damage) => [damage.raw.id, damage]));
  const inferred: Array<DamageInstanceWithAlternativeDefinitions> = [];

  for (const damage of damages) {
    const groupedIds = parseIdsFromInstanceCondition(damage.raw);
    if (!groupedIds) {
      continue;
    }

    const primaryDamage = damageById.get(groupedIds.primaryId);
    const alternativeDamage = damageById.get(groupedIds.alternativeId);
    if (!primaryDamage?.damageInstance || !alternativeDamage?.damageInstance) {
      continue;
    }

    const primary = primaryDamage.damageInstance;
    const alternative = alternativeDamage.damageInstance;

    const matchedSequenceMultiplier = getMatchedSequenceMultiplier(
      primary,
      alternative,
      sequnceMultipliers,
    );
    if (!matchedSequenceMultiplier?.sequence) {
      continue;
    }

    inferred.push({
      ...primary,
      alternativeDefinitions: {
        [matchedSequenceMultiplier.sequence]: alternative,
      },
    });
  }

  return inferred;
};

const inferFromSequenceMultipliers = (
  damages: Array<DamageWithMaybeInstance>,
  sequnceMultipliers: Array<{ value: number; sequence: Sequence }>,
): Array<DamageInstanceWithAlternativeDefinitions> => {
  const damagesWithInstances = damages.filter(
    (damage): damage is DamageWithMaybeInstance & { damageInstance: DamageInstance } =>
      damage.damageInstance !== undefined,
  );
  const siblingBuckets = Map.groupBy(damagesWithInstances, ({ raw }) =>
    getSiblingGroupingKey(raw),
  );
  const inferred: Array<DamageInstanceWithAlternativeDefinitions> = [];

  for (const bucket of siblingBuckets.values()) {
    const damageInstances = compact(bucket.map((damage) => damage.damageInstance));
    const pairedGroups = pairDamageInstancesBySequenceMultipliers(
      damageInstances,
      sequnceMultipliers,
    );
    for (const { primary, alternative, sequence } of pairedGroups) {
      inferred.push({
        ...primary,
        alternativeDefinitions: { [sequence]: alternative },
      });
    }
  }
  return inferred;
};

const parseIdsFromInstanceCondition = (
  instance: Pick<Damage, 'condition'>,
): { alternativeId: number; primaryId: number } | undefined => {
  if (!instance.condition.includes('ExecDamage')) {
    return undefined;
  }

  const lines = instance.condition.split('\n');
  const primaryId = lines
    .find((line) => line.includes('NotHasAnyTag') && line.includes('ExecDamage'))
    ?.match(/ExecDamage\s+(\d+)/)?.[1];
  const alternativeId = lines
    .find((line) => line.includes('HasAllTag') && line.includes('ExecDamage'))
    ?.match(/ExecDamage\s+(\d+)/)?.[1];

  if (!primaryId || !alternativeId) {
    return undefined;
  }

  return {
    primaryId: Number.parseInt(primaryId, 10),
    alternativeId: Number.parseInt(alternativeId, 10),
  };
};

const getSiblingGroupingKey = (damage: Damage): string => {
  const {
    condition,
    constVariables,
    calculateType,
    element,
    damageTextType,
    damageTextAreaId,
    payloadId,
    type,
    subType,
    smashType,
    cureBaseValue,
    relatedProperty,
    hardnessLv,
    toughLv,
    energy,
    specialEnergy1,
    specialEnergy2,
    specialEnergy3,
    specialEnergy4,
    specialEnergy5,
    formulaType,
    fluctuationLower,
    fluctuationUpper,
    elementPowerType,
    elementPower,
    weaknessLvl,
    weaknessRatio,
    specialWeaknessDamageRatio,
    immuneType,
    percent0,
    percent1,
    rateLv,
  } = damage;

  return JSON.stringify({
    condition,
    constVariables,
    calculateType,
    element,
    damageTextType,
    damageTextAreaId,
    payloadId,
    type,
    subType,
    smashType,
    cureBaseValue,
    relatedProperty,
    hardnessLv,
    toughLv,
    energy,
    specialEnergy1,
    specialEnergy2,
    specialEnergy3,
    specialEnergy4,
    specialEnergy5,
    formulaType,
    fluctuationLower,
    fluctuationUpper,
    elementPowerType,
    elementPower,
    weaknessLvl,
    weaknessRatio,
    specialWeaknessDamageRatio,
    immuneType,
    percent0,
    percent1,
    length: rateLv.length,
  });
};

const getMatchedSequenceMultiplier = (
  primary: DamageInstance,
  alternative: DamageInstance,
  sequnceMultipliers: Array<{ value: number; sequence: Sequence }>,
): { value: number; sequence: Sequence } | undefined => {
  if (primary.motionValue <= 0 || alternative.motionValue <= 0) {
    return undefined;
  }
  const actualMultiplier = alternative.motionValue / primary.motionValue;
  return sequnceMultipliers.find((sequenceMultiplier) => {
    const relativeDifference =
      Math.abs(actualMultiplier - sequenceMultiplier.value) / sequenceMultiplier.value;
    return relativeDifference < ALTERNATIVE_MULTIPLIER_TOLERANCE;
  });
};

const pairDamageInstancesBySequenceMultipliers = (
  damageInstances: Array<DamageInstance>,
  sequnceMultipliers: Array<{ value: number; sequence: Sequence }>,
) => {
  const sortedDamageInstances = sortBy(damageInstances, ['motionValue']);
  const remainingIds = new Set(sortedDamageInstances.map((instance) => instance.id));
  const pairedGroups: Array<{
    alternative: DamageInstance;
    primary: DamageInstance;
    sequence: Sequence;
  }> = [];

  const candidatePairs = sortedDamageInstances.flatMap((primary, primaryIndex) =>
    sortedDamageInstances.slice(primaryIndex + 1).flatMap((alternative) => {
      const matchedSequenceMultiplier = getMatchedSequenceMultiplier(
        primary,
        alternative,
        sequnceMultipliers,
      );
      if (!matchedSequenceMultiplier) return [];
      return [
        {
          primary,
          alternative,
          sequence: matchedSequenceMultiplier.sequence,
        },
      ];
    }),
  );
  for (const { primary, alternative, sequence } of candidatePairs) {
    if (!remainingIds.has(primary.id) || !remainingIds.has(alternative.id)) {
      continue;
    }

    remainingIds.delete(primary.id);
    remainingIds.delete(alternative.id);
    pairedGroups.push({ primary, alternative, sequence });
  }

  return pairedGroups;
};
