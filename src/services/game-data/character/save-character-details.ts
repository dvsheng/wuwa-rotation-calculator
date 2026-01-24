import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import type { Character } from './types';

const characterStore = createFsStore<Character>();

export const saveCharacterDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: character }) => {
    console.log('Saving character:', character.id, character.name);
    const key = `character/parsed/${character.id}.json`;

    await characterStore.put(key, character);
    console.log('Successfully saved character:', character.id);
    return { success: true };
  });
