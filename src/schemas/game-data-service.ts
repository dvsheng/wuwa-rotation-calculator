import { z } from 'zod';

import { SetEffectRequirement } from '@/services/game-data/echo-set/types';
import { RefineLevel } from '@/services/game-data/weapon/types';

/**
 * Base schema for fetching an entity by its ID.
 */
export const GetEntityDetailsInputSchema = z.object({
  /** The ID of the entity to fetch */
  id: z.string(),
});

/**
 * Base input for services that fetch client-facing entity details.
 */
export type GetClientEntityDetailsInput = z.infer<typeof GetEntityDetailsInputSchema>;

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
 * Zod schema for character details service input.
 */
export const GetCharacterDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The resonance chain sequence (0-6) of the character */
  sequence: z.number().min(0).max(6).default(0),
});

/**
 * Input to the character details service (whether internal or client-facing)
 */
export type GetCharacterDetailsInput = z.infer<typeof GetCharacterDetailsInputSchema>;

/**
 * Zod schema for echo set details service input.
 */
export const GetEchoSetDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The number of pieces equipped from this set */
  requirement: z.enum(SetEffectRequirement),
});

/**
 * Input for fetching echo set details.
 */
export type GetEchoSetDetailsInput = z.infer<typeof GetEchoSetDetailsInputSchema>;
