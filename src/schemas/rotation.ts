import { z } from 'zod';

const ParameterSchema = z.object({
  minimum: z.number(),
  maximum: z.number(),
});

export const AttackSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  characterName: z.string().optional(),
  parentName: z.string().optional(),
  parameters: z.array(ParameterSchema).optional(),
});

export type Attack = z.infer<typeof AttackSchema>;

export const BuffSchema = z.object({
  timelineId: z.string(), // Instance ID (random UUID)
  characterId: z.string(),
  characterName: z.string(),
  skillName: z.string(),
  description: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  isParameterized: z.boolean(),
  parameterValue: z.number().optional(),
});

export type Buff = z.infer<typeof BuffSchema>;

export const RotationSchema = z.object({
  attacks: z.array(AttackSchema),
  buffs: z.array(BuffSchema),
});

export type Rotation = z.infer<typeof RotationSchema>;
