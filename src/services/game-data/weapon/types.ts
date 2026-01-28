import { z } from 'zod';

import type { BaseEntity, Capabilities } from '../common-types';

export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

/**
 * The core Weapon data structure used for damage calculations and rotation building.
 */
export interface Weapon extends BaseEntity {
  capabilities: Record<RefineLevel, Capabilities>;
}

export const GetWeaponDetailsInputSchema = z.object({
  id: z.string(),
  refineLevel: z.enum(RefineLevel),
});

export type GetWeaponDetailsInput = z.infer<typeof GetWeaponDetailsInputSchema>;

/**
 * Output for getWeaponDetails - returns the weapon with capabilities for a specific refine level
 */
export interface GetWeaponDetailsOutput extends BaseEntity {
  capabilities: Capabilities;
}
