import { z } from 'zod';

import type {
  Attack as ClientAttack,
  Buff as ClientModifier,
} from '@/schemas/rotation';
import type { CharacterStat } from '@/types/server';

import type { Attack, BaseEntity, Modifiers, PermanentStats } from '../common-types';

export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

interface RefineProperties {
  /**
   * An additional attack that a weapon adds.
   */
  attack?: Attack;
  /**
   * Temporary or conditional buffs (e.g., Outro skills, field effects).
   */
  modifiers: Modifiers;
  /**
   * Permanent stats that are derived from the weapon's special effect
   */
  stats: PermanentStats;
}

/**
 * The core Weapon data structure used for damage calculations and rotation building.
 */
export interface Weapon extends BaseEntity {
  attributes: Record<RefineLevel, RefineProperties>;
  baseStats: Record<CharacterStat, number>;
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

export interface GetServerWeaponDetailsOutput {
  attack?: Attack;
  modifiers: Modifiers;
  stats: PermanentStats;
}
