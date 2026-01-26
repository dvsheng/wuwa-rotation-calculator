import { z } from 'zod';

import { EchoStatsSchema } from './echo';
import { EchoSetSchema } from './echo-set';
import { WeaponSchema } from './weapon';

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number().min(0).max(6),
  weapon: WeaponSchema,
  echoSets: z.array(EchoSetSchema).min(1).max(2),
  primarySlotEcho: z.object({
    id: z.string(),
    name: z.string(),
  }),
  echoStats: z.array(EchoStatsSchema),
});

export type Character = z.infer<typeof CharacterSchema>;
