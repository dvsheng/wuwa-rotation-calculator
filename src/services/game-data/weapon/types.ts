import { z } from 'zod';

import { GetEntityDetailsInputSchema } from '../common-types';
import type {
  BaseEntity,
  Capabilities,
  GetClientEntityDetailsOutput,
} from '../common-types';

/**
 * Valid weapon refinement levels (1 through 5).
 */
export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

/**
 * The core Weapon data structure as stored in JSON files.
 */
export interface StoreWeapon extends BaseEntity {
  /** Map of refinement levels to their respective effects (Capabilities) */
  capabilities: Record<RefineLevel, Capabilities>;
}

/**
 * Zod schema for weapon details service input.
 */
export const GetWeaponDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The refinement level of the weapon (1-5) */
  refineLevel: z.enum(RefineLevel),
});

/**
 * Input for fetching weapon details.
 */
export type GetWeaponDetailsInput = z.infer<typeof GetWeaponDetailsInputSchema>;

/**
 * Output format for client-facing weapon details.
 */
export type GetClientWeaponDetailsOutput = GetClientEntityDetailsOutput;

/**
 * Representation of a Weapon at a specific refinement level.
 */
export interface Weapon extends BaseEntity {
  /** The active effects for the specified refinement level */
  capabilities: Capabilities;
}
