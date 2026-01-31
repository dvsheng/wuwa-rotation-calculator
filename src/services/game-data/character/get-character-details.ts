import { createServerFn } from '@tanstack/react-start';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { ClientCapability } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetCharacterDetailsInputSchema, Sequence } from './types';
import type {
  Character,
  CharacterCapabilityProperties,
  GetCharacterDetailsInput,
  StoreCharacter,
} from './types';

const characterStore = createFsStore<StoreCharacter>();

export interface GetClientCharacterDetailsOutput {
  id: string;
  name: string;
  attacks: Array<ClientCapability>;
  modifiers: Array<ClientCapability>;
}

/**
 * Shared handler for fetching character details.
 */
export const getCharacterDetailsHandler = async (
  id: string,
  sequence?: number,
): Promise<StoreCharacter> => {
  const key = `character/parsed/${id}.json`;

  const characterData = await characterStore.get(key);
  if (!characterData) {
    throw new Error(`Failed to fetch character details for ID ${id}`);
  }

  const isCapabilityActive = (item: CharacterCapabilityProperties): boolean => {
    if (sequence === undefined) return true;
    const unlockedAt = sequenceToNumber(item.unlockedAt);
    const disabledAt = item.disabledAt ? sequenceToNumber(item.disabledAt) : Infinity;

    return sequence >= unlockedAt && sequence < disabledAt;
  };

  characterData.capabilities.attacks = characterData.capabilities.attacks
    .filter(isCapabilityActive)
    .map((attack) => {
      attack.attribute = characterData.attribute;
      attack.tags = [attack.name, attack.attribute, ...attack.tags];
      return attack;
    });

  characterData.capabilities.modifiers =
    characterData.capabilities.modifiers.filter(isCapabilityActive);

  characterData.capabilities.permanentStats =
    characterData.capabilities.permanentStats.filter(isCapabilityActive);

  return characterData;
};

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

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetCharacterDetailsInputSchema)
  .handler(async ({ data }): Promise<Character> => {
    return getCharacterDetailsHandler(data.id, data.sequence);
  });

export const getClientCharacterDetailsHandler = async (
  input: GetCharacterDetailsInput,
): Promise<GetClientCharacterDetailsOutput> => {
  const { id, sequence } = input;
  const character = await getCharacterDetailsHandler(id, sequence);

  return {
    id: character.id,
    name: character.name,
    attacks: character.capabilities.attacks.map((attack) =>
      toClientAttack(attack, attack.parentName, attack.name),
    ),
    modifiers: character.capabilities.modifiers.map((modifier) =>
      toClientBuff(modifier, modifier.parentName, modifier.name),
    ),
  };
};

export const getClientCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetCharacterDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientCharacterDetailsOutput> => {
    return getClientCharacterDetailsHandler(data);
  });
