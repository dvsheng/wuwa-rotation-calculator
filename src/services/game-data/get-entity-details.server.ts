import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import type { Entity, StoreCapability } from '@/db/schema';
import { EntityType, entities } from '@/db/schema';
import type { GetEntityDetailsInput } from '@/schemas/game-data-service';
import {
  replaceNullsWithUndefined,
  resolveStoreNumberType,
} from '@/services/game-data/database-type-adapters';
import { Tag } from '@/types';
import type { Attribute } from '@/types';

import { toClientAttack, toClientBuff } from './client-type-adapters';
import { OriginType } from './types';
import type {
  Attack,
  BaseEntity,
  GetClientEntityDetailsOutput,
  RefineLevel,
  Sequence,
} from './types';

/**
 * Convert sequence string to number (e.g., 's1' -> 1, 's2' -> 2).
 */
const sequenceToNumber = (sequence?: Sequence): number => {
  if (!sequence) return 0;
  return Number.parseInt(sequence.slice(1), 10);
};

const refineLevelToNumber = (refineLevel?: RefineLevel): number => {
  if (!refineLevel) return 0;
  return Number.parseInt(refineLevel);
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
 * Resolve a capability by merging the highest applicable alternativeDefinition.
 */
const resolveCapabilitySequence = <
  TChild,
  T extends { alternativeDefinitions?: Partial<Record<Sequence, TChild>> },
>(
  capability: T,
  sequence: number = 0,
): Omit<T, 'alternativeDefinitions'> => {
  const applicableSeq = getApplicableSequence(
    capability.alternativeDefinitions,
    sequence,
  );

  const { alternativeDefinitions, ...base } = capability;

  if (!applicableSeq || !alternativeDefinitions) {
    return base;
  }

  const override = alternativeDefinitions[applicableSeq];
  return { ...base, ...override };
};

/**
 * Check if a capability is active at the given sequence.
 */
const isCapabilityActive = (
  item: { unlockedAt?: Sequence; echoSetBonusRequirement?: number },
  activatedSequence: number = 0,
  activatedSetBonus: number = 0,
): boolean => {
  const unlockedAtSequence = sequenceToNumber(item.unlockedAt);
  if (activatedSequence < unlockedAtSequence) {
    return false;
  }
  if (item.echoSetBonusRequirement !== undefined) {
    const requiredSetBonus = item.echoSetBonusRequirement;
    return activatedSetBonus >= requiredSetBonus;
  }
  return true;
};

const addAttributeToAttack = <T>(attack: T, attribute: Attribute) => ({
  ...attack,
  attribute,
});

const appendTagsToAttack = (attack: Attack, tags: Array<string> = []) => ({
  ...attack,
  tags: [...attack.tags, ...tags],
});

const entityTypeToOriginTypeMap: Record<EntityType, OriginType> = {
  character: OriginType.BASE_STATS,
  weapon: OriginType.WEAPON,
  echo: OriginType.ECHO,
  echo_set: OriginType.ECHO_SET,
};

const addCapabilityDefaultValues = <T extends StoreCapability>(
  capability: T,
  entity: Entity,
  capabilityType: string,
) => {
  return {
    ...capability,
    name: capability.name ?? `${entity.name} ${capabilityType}`,
    parentName: capability.parentName ?? `${entity.type} ${capabilityType}`,
    description: capability.description ?? '',
    originType: capability.originType ?? entityTypeToOriginTypeMap[entity.type],
  };
};

/**
 * Shared handler for fetching character details from database.
 * Resolves alternativeDefinitions based on the requested sequence.
 */
export const getEntityByHakushinIdHandler = async (
  options: GetEntityDetailsInput,
): Promise<BaseEntity> => {
  // Query entity with all capabilities
  const entity = await database.query.entities.findFirst({
    where: eq(entities.hakushinId, options.id),
    with: {
      attacks: true,
      modifiers: true,
      permanentStats: true,
    },
  });
  if (!entity) {
    console.error(`Entity not found for ID ${options.id}`);
    throw new Error(`Entity not found for ID ${options.id}`);
  }

  const attribute = entity.attribute!;
  const sequence =
    options.entityType === EntityType.CHARACTER ? options.activatedSequence : 0;
  const refineLevel =
    options.entityType === EntityType.WEAPON
      ? refineLevelToNumber(options.refineLevel)
      : 0;
  const activatedSetBonus =
    options.entityType === EntityType.ECHO_SET ? options.activatedSetBonus : 0;

  // Filter and resolve attacks, adding attribute
  const attacks = entity.attacks
    .map((attack) => addCapabilityDefaultValues(attack, entity, 'Attack'))
    .map((attack) => resolveStoreNumberType(attack, refineLevel))
    .map((attack) => replaceNullsWithUndefined(attack))
    .filter((attack) => isCapabilityActive(attack, sequence, activatedSetBonus))
    .map((attack) => resolveCapabilitySequence(attack, sequence))
    .map((attack) => addAttributeToAttack(attack, attribute))
    .map((attack) =>
      appendTagsToAttack(attack, [
        attack.name,
        attack.attribute,
        ...(entity.type === EntityType.ECHO ? [Tag.ECHO] : []),
      ]),
    );

  // Filter and resolve modifiers
  const modifiers = entity.modifiers
    .map((attack) => addCapabilityDefaultValues(attack, entity, 'Buff'))
    .map((modifier) => resolveStoreNumberType(modifier, refineLevel))
    .map((modifier) => replaceNullsWithUndefined(modifier))
    .filter((modifier) => isCapabilityActive(modifier, sequence, activatedSetBonus))
    .map((modifier) => resolveCapabilitySequence(modifier, sequence));

  // Filter and resolve permanent stats
  const permanentStats = entity.permanentStats
    .map((attack) => addCapabilityDefaultValues(attack, entity, 'Permanent Stat'))
    .map((stat) => resolveStoreNumberType(stat, refineLevel))
    .map((stat) => replaceNullsWithUndefined(stat))
    .filter((stat) => isCapabilityActive(stat, sequence, activatedSetBonus));

  return {
    id: entity.id,
    hakushinId: entity.hakushinId ?? undefined,
    name: entity.name,
    capabilities: {
      attacks: attacks,
      modifiers: modifiers,
      permanentStats: permanentStats,
    },
  };
};

export const getClientEntityByHakushinIdHandler = async (
  options: GetEntityDetailsInput,
): Promise<GetClientEntityDetailsOutput> => {
  const entity = await getEntityByHakushinIdHandler(options);
  return {
    id: entity.id,
    name: entity.name,
    attacks: entity.capabilities.attacks.map((attack) => toClientAttack(attack)),
    modifiers: entity.capabilities.modifiers.map((modifier) => toClientBuff(modifier)),
  };
};
