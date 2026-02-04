import { createServerFn } from '@tanstack/react-start';
import { mapValues } from 'es-toolkit/object';

import { toClientAttack, toClientBuff } from '../client-converters';
import type { Capabilities } from '../common-types';
import { createFsStore } from '../hakushin-api/fs-store';

import { GetWeaponDetailsInputSchema } from './types';
import type {
  GetClientWeaponDetailsOutput,
  GetWeaponDetailsInput,
  RefineScalableNumber,
  StoreWeapon,
  Weapon,
} from './types';

const weaponStore = createFsStore<StoreWeapon>();

/**
 * Checks if a value is a RefineScalableNumber.
 */
export const isRefineScalableNumber = (
  value: unknown,
): value is RefineScalableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'base' in value &&
    'increment' in value &&
    typeof (value as RefineScalableNumber).base === 'number' &&
    typeof (value as RefineScalableNumber).increment === 'number'
  );
};

/**
 * Resolves all RefineScalableNumber values in an object tree to plain numbers.
 * Preserves the structure of UserParameterizedNumber and other nested objects.
 */
export const resolveRefineScaling = <T>(value: T, refineLevel: number): T => {
  // Resolve RefineScalableNumber to plain number
  if (isRefineScalableNumber(value)) {
    return (value.base + (refineLevel - 1) * value.increment) as T;
  }

  // Recursively process arrays
  if (Array.isArray(value)) {
    return value.map((v) => resolveRefineScaling(v, refineLevel)) as T;
  }

  // Recursively process objects
  if (typeof value === 'object' && value !== null) {
    return mapValues(value as Record<string, unknown>, (v) =>
      resolveRefineScaling(v, refineLevel),
    ) as T;
  }

  // Pass through primitives unchanged
  return value;
};

/**
 * Shared handler for fetching weapon details with capabilities for the specified refine level.
 */
export const getWeaponDetailsHandler = async (
  input: GetWeaponDetailsInput,
): Promise<Weapon> => {
  const { id, refineLevel } = input;
  const key = `weapon/parsed/${id}.json`;

  const weaponData = await weaponStore.get(key);
  if (!weaponData) {
    throw new Error(`Failed to fetch weapon details for ID ${id}`);
  }

  const resolvedCapabilities = resolveRefineScaling(
    weaponData.capabilities,
    Number.parseInt(refineLevel),
  ) as Capabilities;

  return {
    id: weaponData.id,
    uuid: weaponData.uuid,
    name: weaponData.name,
    capabilities: resolvedCapabilities,
  };
};

/**
 * Returns weapon details with capabilities for the specified refine level.
 */
export const getWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<Weapon> => {
    return getWeaponDetailsHandler(data);
  });

/**
 * Returns client-facing enriched attacks and modifiers for the specified refine level.
 */
export const getClientWeaponDetails = createServerFn({
  method: 'GET',
})
  .inputValidator(GetWeaponDetailsInputSchema)
  .handler(async ({ data }): Promise<GetClientWeaponDetailsOutput> => {
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
