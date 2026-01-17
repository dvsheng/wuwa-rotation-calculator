import { z } from 'zod';

import { EchoStatsSchema } from './echo';
import { EchoSetSchema } from './echo-set';
import { WeaponSchema } from './weapon';

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  sequence: z.number().min(0).max(6).default(0),
  weapon: WeaponSchema,
  echoSets: z.union([
    z.tuple([EchoSetSchema]),
    z.tuple([EchoSetSchema, EchoSetSchema]),
  ]),
  primarySlotEcho: z.object({
    id: z.string().default(''),
    name: z.string().default(''),
  }),
  echoStats: z.array(EchoStatsSchema),
});

export type Character = z.infer<typeof CharacterSchema>;
