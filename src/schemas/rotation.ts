import { z } from 'zod';

const ParameterSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
});

export type Parameter = z.infer<typeof ParameterSchema>;

export const AttackSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  parentName: z.string().optional(),
  parameters: z.array(ParameterSchema).optional(),
  isParameterized: z.boolean().optional(),
  parameterValue: z.number().optional(),
});

export type Attack = z.infer<typeof AttackSchema>;

/** Buff item for the palette (without timeline position) */
export const BuffSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  characterName: z.string().optional(),
  parentName: z.string().optional(),
  source: z.enum(['character', 'weapon', 'echo', 'echo-set']).optional(),
  parameters: z.array(ParameterSchema).optional(),
});

export type Buff = z.infer<typeof BuffSchema>;

/** Buff placed on the timeline (with position) */
export const BuffWithPositionSchema = z.object({
  timelineId: z.string(),
  buff: BuffSchema,
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  parameterValue: z.number().optional(),
});

export type BuffWithPosition = z.infer<typeof BuffWithPositionSchema>;

export const RotationSchema = z.object({
  attacks: z.array(AttackSchema),
  buffs: z.array(BuffWithPositionSchema),
});

export type Rotation = z.infer<typeof RotationSchema>;
