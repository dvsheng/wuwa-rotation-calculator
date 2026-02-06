import { createServerFn } from '@tanstack/react-start';

import { GetCharacterDetailsInputSchema } from '@/schemas/game-data-service';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import type {
  Character,
  GetClientCharacterDetailsOutput,
  Sequence,
  StoreCharacter,
} from './types';

const characterStore = createFsStore<StoreCharacter>();

/**
 * Convert sequence string to number (e.g., 's1' -> 1, 's2' -> 2).
 */
const sequenceToNumber = (sequence?: Sequence): number => {
  if (!sequence) return 0;
  return Number.parseInt(sequence.slice(1), 10);
};

/**
 * Get the highest applicable sequence from alternativeDefinitions.
 */
const getApplicableSequence = (
  alternativeDefinitions: Partial<Record<Sequence, unknown>> | undefined,
  sequence: number,
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
const resolveCapability = <
  TChild,
  T extends { alternativeDefinitions?: Partial<Record<Sequence, TChild>> },
>(
  capability: T,
  sequence: number,
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
  item: { unlockedAt?: Sequence },
  sequence: number | undefined,
): boolean => {
  if (sequence === undefined) return true;
  const unlockedAt = sequenceToNumber(item.unlockedAt);
  return sequence >= unlockedAt;
};

/**
 * Shared handler for fetching character details.
 * Resolves alternativeDefinitions based on the requested sequence.
 */
export const getCharacterDetailsHandler = async (
  id: string,
  sequence?: number,
): Promise<Character> => {
  const key = `character/parsed/${id}.json`;

  const characterData = await characterStore.get(key);
  if (!characterData) {
    throw new Error(`Failed to fetch character details for ID ${id}`);
  }

  const seq = sequence ?? 0;
  const attribute = characterData.attribute;

  // Filter and resolve attacks, adding attribute
  const attacks = characterData.capabilities.attacks
    .filter((attack) => isCapabilityActive(attack, sequence))
    .map((attack) => {
      const resolved = resolveCapability(attack, seq);
      return {
        ...resolved,
        attribute,
        tags: [resolved.name, attribute, ...resolved.tags],
      };
    });

  // Filter and resolve modifiers
  const modifiers = characterData.capabilities.modifiers
    .filter((modifier) => isCapabilityActive(modifier, sequence))
    .map((modifier) => resolveCapability(modifier, seq));

  // Filter and resolve permanent stats
  const permanentStats = characterData.capabilities.permanentStats
    .filter((stat) => isCapabilityActive(stat, sequence))
    .map((stat) => resolveCapability(stat, seq));

  return {
    ...characterData,
    capabilities: {
      attacks,
      modifiers,
      permanentStats,
    },
  };
};

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetCharacterDetailsInputSchema)
  .handler(async ({ data }): Promise<Character> => {
    return getCharacterDetailsHandler(data.id, data.sequence);
  });

export const getClientCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetCharacterDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientCharacterDetailsOutput> => {
    const { id, sequence } = data;
    const character = await getCharacterDetailsHandler(id, sequence);
    return {
      id: character.id,
      name: character.name,
      attacks: character.capabilities.attacks.map((attack) =>
        toClientAttack(attack, attack.parentName, attack.name, attack.originType),
      ),
      modifiers: character.capabilities.modifiers.map((modifier) =>
        toClientBuff(modifier, modifier.parentName, modifier.name, modifier.originType),
      ),
    };
  });
