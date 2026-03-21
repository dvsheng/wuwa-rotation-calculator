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

export const RotationVisibilitySchema = z.enum(['private', 'public']);
export type RotationVisibility = z.infer<typeof RotationVisibilitySchema>;

export const SavedRotationSchema = z.object({
  id: z.number(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  totalDamage: z.number().optional(),
  visibility: RotationVisibilitySchema,
  data: SavedRotationDataSchema,
});

export type SavedRotation = z.infer<typeof SavedRotationSchema>;

export const ListedRotationSchema = SavedRotationSchema.omit({
  ownerId: true,
}).extend({
  isOwner: z.boolean(),
  ownerName: z.string(),
});

export type ListedRotation = z.infer<typeof ListedRotationSchema>;
