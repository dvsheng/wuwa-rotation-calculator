import { z } from 'zod';

import { OriginType as CharacterOriginType } from '@/services/game-data/character/types';
import type { ClientCapability, ClientModifier } from '@/services/game-data/common-types';

export const ParameterSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
  value: z.number().optional(),
});

export type Parameter = z.infer<typeof ParameterSchema>;

export const OriginTypeSchema = z.enum([
  ...Object.values(CharacterOriginType),
  'Weapon',
  'Echo',
  'Echo Set',
]);

export type OriginType = z.infer<typeof OriginTypeSchema>;

/**
 * Schema for validating capability data during drag/drop operations.
 */
export const CapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentName: z.string(),
  originType: OriginTypeSchema,
  description: z.string().optional(),
  characterName: z.string(),
  characterId: z.string(),
  parameters: z
    .array(
      z.object({
        minimum: z.number(),
        maximum: z.number(),
        value: z.number().optional(),
      }),
    )
    .optional(),
});

export type Capability = z.infer<typeof CapabilitySchema>;

const CapabilityInstanceSchema = z.object({
  instanceId: z.string(),
  id: z.string(),
  characterId: z.string(),
  parameterValues: z.array(z.number()).optional(),
});

/**
 * Schema for stored attack instances in the rotation store.
 * Contains only client-side data: instance identifier, capability ID, and user parameter values.
 * Full capability metadata is resolved via useTeamAttackInstances hook.
 */
export const AttackInstanceSchema = CapabilityInstanceSchema;

export type AttackInstance = z.infer<typeof AttackInstanceSchema>;

/**
 * Schema for stored modifier instances in the rotation store.
 * Contains only client-side data: instance identifier, capability ID, user parameter values, and position.
 * Full capability metadata is resolved via useTeamModifierInstances hook.
 */
export const ModifierInstanceSchema = CapabilityInstanceSchema.extend({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type ModifierInstance = z.infer<typeof ModifierInstanceSchema>;

export const RotationSchema = z.object({
  attacks: z.array(AttackInstanceSchema),
  buffs: z.array(ModifierInstanceSchema),
});

export type Rotation = z.infer<typeof RotationSchema>;

export interface ClientCharacterDetails {
  characterId: string;
  characterName: string;
}

export type DetailedAttackInstance = AttackInstance &
  ClientCapability &
  ClientCharacterDetails;

export type DetailedModifierInstance = ModifierInstance &
  ClientModifier &
  ClientCharacterDetails;
