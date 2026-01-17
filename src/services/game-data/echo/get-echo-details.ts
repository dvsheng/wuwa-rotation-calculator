import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getEchoIdByName } from './list-echoes';
import type { Echo } from './types';

export const getEchoDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getEchoIdByName(name);
    const filePath = await path.resolve(
      process.cwd(),
      `src/services/game-data/data/echo/parsed/${id}.json`,
    );

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const echoData: Echo = JSON.parse(fileContent);
      return echoData;
    } catch (error) {
      console.error(`Error reading echo data for ID ${id}:`, error);
      throw new Error(`Failed to fetch echo details for ID ${id}`);
    }
  });
