import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { GetClientEntityDetailsOutput } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetWeaponDetailsInputSchema } from './types';
import type { GetWeaponDetailsInput, Weapon } from './types';

const weaponStore = createFsStore<Weapon>();

export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(z.string())
  .handler(async ({ data: id }) => {
    const key = `weapon/parsed/${id}.json`;

    const weaponData = await weaponStore.get(key);
    if (!weaponData) {
      throw new Error(`Failed to fetch weapon details for ID ${id}`);
    }

    return weaponData;
  });

const getClientWeaponDetailsHandler = async (
  input: GetWeaponDetailsInput,
): Promise<GetClientEntityDetailsOutput> => {
  const { id, refineLevel } = input;
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
      toClientBuff(modifier, weapon.name, 'weapon', `${weapon.name} Buff ${index + 1}`),
    ),
  };
};

export const getClientWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }) => {
    return getClientWeaponDetailsHandler(data);
  });
