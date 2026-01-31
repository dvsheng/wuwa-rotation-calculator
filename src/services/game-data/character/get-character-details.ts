import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { ClientCapability } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetClientCharacterDetailsInputSchema, Sequence } from './types';
import type {
  Character,
  CharacterCapabilityProperties,
  GetClientCharacterDetailsInput,
} from './types';

const characterStore = createFsStore<Character>();

export interface GetClientCharacterDetailsOutput {
  id: string;
  name: string;
  attacks: Array<ClientCapability>;
  modifiers: Array<ClientCapability>;
}

/**
 * Shared handler for fetching character details.
 */
export const getCharacterDetailsHandler = async (id: string): Promise<Character> => {
  const key = `character/parsed/${id}.json`;

  const characterData = await characterStore.get(key);
  if (!characterData) {
    throw new Error(`Failed to fetch character details for ID ${id}`);
  }
  characterData.capabilities.attacks.forEach((attack) => {
    attack.attribute = characterData.attribute;
    attack.tags = [attack.attribute, ...attack.tags];
  });

  return characterData;
};

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<Character> => {
    return getCharacterDetailsHandler(id);
  });

const sequenceToNumber = (sequence?: Sequence): number => {
  if (!sequence) return 0;
  switch (sequence) {
    case Sequence.S1:
      return 1;
    case Sequence.S2:
      return 2;
    case Sequence.S3:
      return 3;
    case Sequence.S4:
      return 4;
    case Sequence.S5:
      return 5;
    case Sequence.S6:
      return 6;
    default:
      return 0;
  }
};

const isItemActive = (
  item: CharacterCapabilityProperties,
  currentSequence: number,
): boolean => {
  const unlockedAt = sequenceToNumber(item.unlockedAt);
  const disabledAt = item.disabledAt ? sequenceToNumber(item.disabledAt) : Infinity;

  return currentSequence >= unlockedAt && currentSequence < disabledAt;
};

export const getClientCharacterDetailsHandler = async (
  input: GetClientCharacterDetailsInput,
): Promise<GetClientCharacterDetailsOutput> => {
  const { id, sequence } = input;
  const character = await getCharacterDetailsHandler(id);

  return {
    id: character.id,
    name: character.name,
    attacks: character.capabilities.attacks
      .filter((attack) => isItemActive(attack, sequence))
      .map((attack) => toClientAttack(attack, attack.parentName, attack.name)),
    modifiers: character.capabilities.modifiers
      .filter((modifier) => isItemActive(modifier, sequence))
      .map((modifier) => toClientBuff(modifier, modifier.parentName, modifier.name)),
  };
};

export const getClientCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetClientCharacterDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientCharacterDetailsOutput> => {
    return getClientCharacterDetailsHandler(data);
  });
