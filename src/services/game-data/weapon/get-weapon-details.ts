import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { toClientAttack, toClientBuff } from '../client-converters';
import { createFsStore } from '../hakushin-api/fs-store';

import { getWeaponIdByName } from './list-weapons';
import { GetWeaponDetailsInputSchema } from './types';
import type {
  GetClientWeaponDetailsOutput,
  GetWeaponDetailsInput,
  Weapon,
} from './types';

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

const getClientWeaponDetailsHandler = async (
  input: GetWeaponDetailsInput,
): Promise<GetClientWeaponDetailsOutput> => {
  const { id, refineLevel } = input;
  const key = `weapon/parsed/${id}.json`;
  const weapon = await weaponStore.get(key);
  if (!weapon) {
    throw new Error(`Failed to fetch weapon details for ID ${id}`);
  }
  const weaponAttributes = weapon.attributes[refineLevel];
  const weaponAttack = weaponAttributes.attack
    ? toClientAttack(weaponAttributes.attack, weapon.name, 'Weapon Attack')
    : undefined;

  return {
    attack: weaponAttack,
    modifiers: weaponAttributes.modifiers.map((modifier, index) =>
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
