import { z } from 'zod';

import { EntityType } from '@/db/schema';
import { RefineLevel, SetEffectRequirement } from '@/services/game-data/types';
import { WeaponType } from '@/types';

import { EnemySchema } from './enemy';
import { AttackInstanceSchema, ModifierInstanceSchema } from './rotation';
import { TeamSchema } from './team';

export const GetEntityDetailsRequestSchema = z.discriminatedUnion('entityType', [
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

export type GetEntityDetailsRequest = z.infer<typeof GetEntityDetailsRequestSchema>;

export const ListEntitiesRequestSchema = z.discriminatedUnion('entityType', [
  z.object({
    entityType: z.literal(EntityType.CHARACTER),
    weaponType: z.enum(WeaponType).optional(),
  }),
  z.object({
    entityType: z.literal(EntityType.WEAPON),
    weaponType: z.enum(WeaponType).optional(),
  }),
  z.object({
    entityType: z.literal(EntityType.ECHO),
  }),
  z.object({
    entityType: z.literal(EntityType.ECHO_SET),
  }),
]);

export type ListEntitiesRequest = z.infer<typeof ListEntitiesRequestSchema>;

export const CalculateRotationInputSchema = z.object({
  team: TeamSchema,
  enemy: EnemySchema,
  attacks: z.array(AttackInstanceSchema),
  buffs: z.array(ModifierInstanceSchema),
});

export type CalculateRotationInput = z.infer<typeof CalculateRotationInputSchema>;

// Icon Service Types
export const IconRequestType = {
  ATTACK: 'attack',
  MODIFIER: 'modifier',
  ENTITY: 'entity',
} as const;

export type IconRequestType = (typeof IconRequestType)[keyof typeof IconRequestType];

export const IconRequestSchema = z.object({
  id: z.number(), // For entities, this is the hakushinId (game ID), not the database ID
  type: z.enum(IconRequestType),
});

export type IconRequest = z.infer<typeof IconRequestSchema>;

export const GetIconsRequestSchema = z.array(IconRequestSchema);

export type GetIconsRequest = z.infer<typeof GetIconsRequestSchema>;
