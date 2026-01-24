import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createFsStore } from '../hakushin-api/fs-store';

import type { Weapon } from './types';

const weaponStore = createFsStore<Weapon>();

export const saveWeaponDetails = createServerFn({
  method: 'POST',
})
  .inputValidator(z.any())
  .handler(async ({ data: weapon }) => {
    console.log('Saving weapon:', weapon.id, weapon.name);
    const key = `weapon/parsed/${weapon.id}.json`;

    await weaponStore.put(key, weapon);
    console.log('Successfully saved weapon:', weapon.id);
    return { success: true };
  });
