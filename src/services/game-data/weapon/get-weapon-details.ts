import { createServerFn } from '@tanstack/react-start';

import { toClientAttack, toClientBuff } from '../client-converters';
import type {
  GetClientEntityDetailsOutput,
  GetEntityDetailsOutput,
} from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetWeaponDetailsInputSchema } from './types';
import type { GetWeaponDetailsInput, Weapon } from './types';

const weaponStore = createFsStore<Weapon>();

/**
 * Shared handler for fetching weapon details with capabilities for the specified refine level.
 */
export const getWeaponDetailsHandler = async (
  input: GetWeaponDetailsInput,
): Promise<GetEntityDetailsOutput> => {
  const { id, refineLevel } = input;
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
};

/**
 * Returns weapon details with capabilities for the specified refine level.
 */
export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<GetEntityDetailsOutput> => {
    return getWeaponDetailsHandler(data);
  });

/**
 * Returns client-facing enriched attacks and modifiers for the specified refine level.
 */
export const getClientWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientEntityDetailsOutput> => {
    const weapon = await getWeaponDetailsHandler(data);
    return {
      attacks: weapon.capabilities.attacks.map((attack) =>
        toClientAttack(attack, weapon.name, 'Weapon Attack'),
      ),
      modifiers: weapon.capabilities.modifiers.map((modifier, index) =>
        toClientBuff(modifier, weapon.name, `${weapon.name} Buff ${index + 1}`),
      ),
    };
  });
