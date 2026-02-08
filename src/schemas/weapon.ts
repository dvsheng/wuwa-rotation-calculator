import { z } from 'zod';

import { RefineLevel } from '@/services/game-data/types';

export const WeaponSchema = z.object({
  id: z.number(),
  refine: z.enum(RefineLevel),
});

export type Weapon = z.infer<typeof WeaponSchema>;
