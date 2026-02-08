import { z } from 'zod';

export const ParameterInstanceSchema = z.object({
  id: z.string(),
  value: z.number().optional(),
});

export type ParameterInstance = z.infer<typeof ParameterInstanceSchema>;

export const CapabilitySchema = z.object({
  id: z.number(),
  characterId: z.number(),
  parameterValues: z.array(ParameterInstanceSchema).optional(),
});

export type Capability = z.infer<typeof CapabilitySchema>;

const CapabilityInstanceSchema = CapabilitySchema.extend({
  instanceId: z.string(),
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
