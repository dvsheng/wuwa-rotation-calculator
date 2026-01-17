import fs from 'node:fs';
import path from 'node:path';

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { getWeaponIdByName } from './list-weapons';
import type { Weapon } from './types';

export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getWeaponIdByName(name);
    const filePath = await path.resolve(
      process.cwd(),
      `src/services/game-data/data/weapon/parsed/${id}.json`,
    );

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const weaponData: Weapon = JSON.parse(fileContent);
      return weaponData;
    } catch (error) {
      console.error(`Error reading weapon data for ID ${id}:`, error);
      throw new Error(`Failed to fetch weapon details for ID ${id}`);
    }
  });
