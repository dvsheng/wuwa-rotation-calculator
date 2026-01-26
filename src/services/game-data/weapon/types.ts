import { z } from 'zod';

import type {
  Attack as ClientAttack,
  Buff as ClientModifier,
} from '@/schemas/rotation';

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

export interface GetClientWeaponDetailsOutput {
  attack?: Omit<ClientAttack, 'id' | 'characterName'>;
  modifiers: Array<Omit<ClientModifier, 'id' | 'characterName'>>;
}
