import { z } from 'zod';

/**
 * Base schema for user-input capability instances.
 * Stores only the data provided by the user, while descriptive metadata
 * is resolved via game-data services using the ID.
 */
export const CapabilitySchema = z.object({
  id: z.string(), // Game data ID (skillId or modifierId)
  characterId: z.string(), // Which character provides/performs it
  parameterValues: z.array(z.number()).optional(),
});

export type Capability = z.infer<typeof CapabilitySchema>;

/**
 * Represents the user's input for a single attack in a rotation.
 * Extends CapabilitySchema by adding an instance UUID for ordering and timeline placement.
 */
export const AttackSchema = CapabilitySchema.extend({
  instanceId: z.string(), // Unique UUID for this specific instance in the sequence
});

export type Attack = z.infer<typeof AttackSchema>;

/**
 * Represents the user's input for a single buff/modifier as it exists in a palette.
 */
export const BuffSchema = CapabilitySchema;

export type Buff = z.infer<typeof BuffSchema>;

/**
 * Buff placed on the timeline (with position).
 * Similar to AttackSchema, it is a Capability enriched with user-decided form info (position and instanceId).
 */
export const BuffWithPositionSchema = CapabilitySchema.extend({
  instanceId: z.string(), // Unique UUID for this specific placement
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type BuffWithPosition = z.infer<typeof BuffWithPositionSchema>;

export const RotationSchema = z.object({
  attacks: z.array(AttackSchema),
  buffs: z.array(BuffWithPositionSchema),
});

export type Rotation = z.infer<typeof RotationSchema>;

/**
 * Metadata for parameters, used when enriching the store data with game-data details.
 * This is NOT stored in the form-driven store but fetched via queries.
 */
export const ParameterMetadataSchema = z.object({
  name: z.string().optional(),
  minimum: z.number(),
  maximum: z.number(),
});

export type ParameterMetadata = z.infer<typeof ParameterMetadataSchema>;
