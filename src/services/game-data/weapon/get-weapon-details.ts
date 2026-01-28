import { createServerFn } from '@tanstack/react-start';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { GetClientEntityDetailsOutput } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetWeaponDetailsInputSchema } from './types';
import type { GetWeaponDetailsOutput, Weapon } from './types';

const weaponStore = createFsStore<Weapon>();

/**
 * Returns weapon details with capabilities for the specified refine level.
 */
export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<GetWeaponDetailsOutput> => {
    const { id, refineLevel } = data;
    const key = `weapon/parsed/${id}.json`;

    const weaponData = await weaponStore.get(key);
    if (!weaponData) {
      throw new Error(`Failed to fetch weapon details for ID ${id}`);
    }

    return {
      id: weaponData.id,
      uuid: weaponData.uuid,
      name: weaponData.name,
      capabilities: weaponData.capabilities[refineLevel],
    };
  });

/**
 * Returns client-facing enriched attacks and modifiers for the specified refine level.
 */
export const getClientWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientEntityDetailsOutput> => {
    const { id, refineLevel } = data;
    const key = `weapon/parsed/${id}.json`;
    const weapon = await weaponStore.get(key);
    if (!weapon) {
      throw new Error(`Failed to fetch weapon details for ID ${id}`);
    }
    const capabilities = weapon.capabilities[refineLevel];
    return {
      attacks: capabilities.attacks.map((attack) =>
        toClientAttack(attack, weapon.name, 'Weapon Attack'),
      ),
      modifiers: capabilities.modifiers.map((modifier, index) =>
        toClientBuff(modifier, weapon.name, `${weapon.name} Buff ${index + 1}`),
      ),
    };
  });
