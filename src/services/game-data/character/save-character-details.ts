import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const saveCharacterDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: character }) => {
    await Promise.resolve(); // satisfy eslint async requirement
    console.log('Saving character:', character.id, character.name);
    const filePath = path.resolve(
      process.cwd(),
      `src/services/game-data/data/character/parsed/${character.id}.json`,
    );

    try {
      console.log('Resolved path:', filePath);
      // Ensure the directory exists (though it should)
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log('Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(character, null, 2), 'utf-8');
      console.log('Successfully wrote to:', filePath);
      return { success: true };
    } catch (error) {
      console.error(`Error saving character data for ID ${character.id}:`, error);
      throw new Error(`Failed to save character details for ID ${character.id}`);
    }
  });
