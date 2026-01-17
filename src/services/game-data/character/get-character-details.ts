import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getCharacterIdByName } from './list-characters';
import type { Character } from './types';

export const getCharacterDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getCharacterIdByName(name);
    const filePath = await path.resolve(
      process.cwd(),
      `src/services/game-data/data/character/parsed/${id}.json`,
    );

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const characterData: Character = JSON.parse(fileContent);
      return characterData;
    } catch (error) {
      console.error(`Error reading character data for ID ${id}:`, error);
      throw new Error(`Failed to fetch character details for ID ${id}`);
    }
  });
