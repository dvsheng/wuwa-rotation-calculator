import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import { getWeaponIdByName } from './list-weapons';
import type { Weapon } from './types';

const weaponStore = createFsStore<Weapon>();

export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const id = await getWeaponIdByName(name);
    const key = `weapon/parsed/${id}.json`;

    const weaponData = await weaponStore.get(key);
    if (!weaponData) {
      throw new Error(`Failed to fetch weapon details for ID ${id}`);
    }

    return weaponData;
  });
