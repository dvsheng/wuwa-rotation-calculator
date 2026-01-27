import { z } from 'zod';

export const WeaponSchema = z.object({
  id: z.string(),
  refine: z.number().min(1).max(5),
});

export type Weapon = z.infer<typeof WeaponSchema>;
