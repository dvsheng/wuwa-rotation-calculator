import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import type { Character, GetClientCharacterDetailsOutput } from './types';

const characterStore = createFsStore<Character>();

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const key = `character/parsed/${id}.json`;

    const characterData = await characterStore.get(key);
    if (!characterData) {
      throw new Error(`Failed to fetch character details for ID ${id}`);
    }

    return characterData;
  });

export const getClientCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<GetClientCharacterDetailsOutput> => {
    const key = `character/parsed/${id}.json`;
    const character = await characterStore.get(key);
    if (!character) {
      throw new Error(`Failed to fetch character details for ID ${id}`);
    }

    return {
      attacks: character.attacks.map((attack) =>
        toClientAttack(attack, attack.parentName, attack.name),
      ),
      modifiers: character.modifiers.map((modifier) =>
        toClientBuff(modifier, modifier.parentName, 'character', modifier.name),
      ),
    };
  });
