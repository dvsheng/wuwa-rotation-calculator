import { z } from 'zod';

export const RefineLevelSchema = z.number().int().min(1).max(5);

export const WeaponSchema = z.object({
  id: z.number(),
  refine: RefineLevelSchema,
});

export type Weapon = z.infer<typeof WeaponSchema>;
