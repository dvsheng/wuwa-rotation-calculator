import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const saveEchoDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: echo }) => {
    await Promise.resolve(); // satisfy eslint async requirement
    console.log('Saving echo:', echo.id, echo.name);
    const filePath = path.resolve(
      process.cwd(),
      `src/services/game-data/data/echo/parsed/${echo.id}.json`,
    );

    try {
      console.log('Resolved path:', filePath);
      // Ensure the directory exists (though it should)
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log('Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(echo, null, 2), 'utf-8');
      console.log('Successfully wrote to:', filePath);
      return { success: true };
    } catch (error) {
      console.error(`Error saving echo data for ID ${echo.id}:`, error);
      throw new Error(`Failed to save echo details for ID ${echo.id}`);
    }
  });
