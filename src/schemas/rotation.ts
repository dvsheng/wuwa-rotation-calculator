import { z } from 'zod';

export const ParameterSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
  value: z.number().optional(),
});

export type Parameter = z.infer<typeof ParameterSchema>;

/**
 * Schema for validating capability data during drag/drop operations.
 * Matches the Capability type from @/types/client/capability.
 */
export const CapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentName: z.string(),
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

/**
 * Schema for stored attack instances in the rotation.
 * Contains only the minimal data needed to identify and configure the attack.
 * Full capability metadata (name, description, etc.) is resolved via game-data services.
 */
export const AttackInstanceSchema = CapabilitySchema.extend({
  instanceId: z.string(), // Unique UUID for this specific instance in the sequence
});

export type AttackInstance = z.infer<typeof AttackInstanceSchema>;

/**
 * Schema for stored modifier/buff instances in the rotation.
 * Contains the minimal data to identify the buff plus its timeline position.
 */
export const ModifierInstanceSchema = CapabilitySchema.extend({
  instanceId: z.string(), // Unique UUID for this specific placement
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
