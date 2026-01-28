import { z } from 'zod';

import { RefineLevel } from '@/services/game-data/weapon/types';

export const WeaponSchema = z.object({
  id: z.string(),
  refine: z.enum(RefineLevel),
});

export type Weapon = z.infer<typeof WeaponSchema>;
