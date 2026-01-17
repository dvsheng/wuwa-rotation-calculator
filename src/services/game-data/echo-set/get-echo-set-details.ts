import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getEchoSetIdByName } from './list-echo-sets';
import type { EchoSet } from './types';

export const getEchoSetDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = getEchoSetIdByName(name);
    const filePath = await path.resolve(
      process.cwd(),
      `src/services/game-data/data/echo-set/parsed/${id}.json`,
    );

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const echoSetData: EchoSet = JSON.parse(fileContent);
      return echoSetData;
    } catch (error) {
      console.error(`Error reading echo set data for ID ${id}:`, error);
      throw new Error(`Failed to fetch echo set details for ID ${id}`);
    }
  });
