import { z } from 'zod';

export const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  refine: z.number().min(1).max(5).default(1),
});

export type Weapon = z.infer<typeof WeaponSchema>;
