import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import { getCharacterIdByName } from './list-characters';
import type { Character } from './types';

const characterStore = createFsStore<Character>();

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getCharacterIdByName(name);
    const key = `character/parsed/${id}.json`;

    const characterData = await characterStore.get(key);
    if (!characterData) {
      throw new Error(`Failed to fetch character details for ID ${id}`);
    }

    return characterData;
  });
