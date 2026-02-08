import { z } from 'zod';

import { EntityType } from '@/db/schema';
import { SetEffectRequirement } from '@/services/game-data/echo-set/types';
import { RefineLevel } from '@/services/game-data/weapon/types';

import { EnemySchema } from './enemy';
import { AttackInstanceSchema, ModifierInstanceSchema } from './rotation';
import { TeamSchema } from './team';

export const GetEntityDetailsInputSchema = z.discriminatedUnion('entityType', [
  z.object({
    id: z.number(),
    entityType: z.literal(EntityType.CHARACTER),
    activatedSequence: z.number().optional(),
  }),
  z.object({
    id: z.number(),
    entityType: z.literal(EntityType.WEAPON),
    refineLevel: z.enum(RefineLevel),
  }),
  z.object({
    id: z.number(),
    entityType: z.literal(EntityType.ECHO_SET),
    activatedSetBonus: z.enum(SetEffectRequirement),
  }),
  z.object({
    id: z.number(),
    entityType: z.enum([EntityType.ECHO]),
  }),
]);

export type GetEntityDetailsInput = z.infer<typeof GetEntityDetailsInputSchema>;

export const CalculateRotationInputSchema = z.object({
  team: TeamSchema,
  enemy: EnemySchema,
  attacks: z.array(AttackInstanceSchema),
  buffs: z.array(ModifierInstanceSchema),
});

export type CalculateRotationInput = z.infer<typeof CalculateRotationInputSchema>;
