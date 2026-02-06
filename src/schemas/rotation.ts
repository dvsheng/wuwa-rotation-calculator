import { z } from 'zod';

export const CapabilitySchema = z.object({ id: z.string(), characterId: z.string() });

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
