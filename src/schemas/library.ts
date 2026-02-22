import { z } from 'zod';

import { EnemySchema } from '@/schemas/enemy';
import { AttackInstanceSchema, ModifierInstanceSchema } from '@/schemas/rotation';
import { TeamSchema } from '@/schemas/team';

export const SavedRotationDataSchema = z.object({
  team: TeamSchema,
  enemy: EnemySchema,
  attacks: z.array(AttackInstanceSchema),
  buffs: z.array(ModifierInstanceSchema),
});

export type SavedRotationData = z.infer<typeof SavedRotationDataSchema>;

export const SavedRotationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  totalDamage: z.number().optional(),
  data: SavedRotationDataSchema,
});

export type SavedRotation = z.infer<typeof SavedRotationSchema>;
