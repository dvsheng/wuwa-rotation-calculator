import { z } from 'zod';

import { Attribute } from '@/types';

export const EnemySchema = z.object({
  level: z.number().int().min(1).max(120),
  resistances: z.object({
    [Attribute.GLACIO]: z.number(),
    [Attribute.FUSION]: z.number(),
    [Attribute.AERO]: z.number(),
    [Attribute.ELECTRO]: z.number(),
    [Attribute.HAVOC]: z.number(),
    [Attribute.SPECTRO]: z.number(),
  }),
});

export type Enemy = z.infer<typeof EnemySchema>;

export const initialEnemyData: Enemy = {
  level: 90,
  resistances: {
    [Attribute.GLACIO]: 10,
    [Attribute.FUSION]: 10,
    [Attribute.AERO]: 10,
    [Attribute.ELECTRO]: 10,
    [Attribute.HAVOC]: 10,
    [Attribute.SPECTRO]: 10,
  },
};
