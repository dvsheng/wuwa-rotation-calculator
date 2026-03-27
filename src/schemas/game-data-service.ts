import { z } from 'zod';

import {
  EntityType,
  RefineLevel,
  SetEffectRequirement,
} from '@/services/game-data/types';

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

export const CalculateRotationInputSchema = z.object({
  team: TeamSchema,
  enemy: EnemySchema,
  attacks: z.array(AttackInstanceSchema),
  buffs: z.array(ModifierInstanceSchema),
});

export type CalculateRotationInput = z.infer<typeof CalculateRotationInputSchema>;

export const GetEchoStatsRequestSchema = z.object({
  characterId: z.number(),
});

export type GetEchoStatsRequest = z.infer<typeof GetEchoStatsRequestSchema>;

export const ResolveConfigSchema = z
  .object({
    sequence: z.number().min(0).max(6).optional(),
    refineLevel: z.enum(RefineLevel).optional(),
    activatedSetBonus: z.enum(SetEffectRequirement).optional(),
  })
  .describe(
    'Optional capability resolution parameters. An empty object returns stored capabilities without applying sequence, refine, or set-bonus resolution.',
  );

export type ResolveConfig = z.infer<typeof ResolveConfigSchema>;

export const ListCapabilitiesRequestSchema = z.object({
  entityIds: z
    .array(z.int().positive())
    .min(1)
    .describe('The non-empty list of entity IDs to fetch capabilities for'),
});

export type ListCapabilitiesRequest = z.infer<typeof ListCapabilitiesRequestSchema>;

export const ListSkillsRequestSchema = z.object({
  entityIds: z
    .array(z.int().positive())
    .min(1)
    .describe('The non-empty list of entity IDs to fetch skills for'),
});

export type ListSkillsRequest = z.infer<typeof ListSkillsRequestSchema>;
