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
    [Attribute.PHYSICAL]: z.number(),
  }),
});

export type Enemy = z.infer<typeof EnemySchema>;

export const initialEnemyData: Enemy = {
  level: 100,
  resistances: {
    [Attribute.GLACIO]: 20,
    [Attribute.FUSION]: 20,
    [Attribute.AERO]: 20,
    [Attribute.ELECTRO]: 20,
    [Attribute.HAVOC]: 20,
    [Attribute.SPECTRO]: 20,
    [Attribute.PHYSICAL]: 20,
  },
};
