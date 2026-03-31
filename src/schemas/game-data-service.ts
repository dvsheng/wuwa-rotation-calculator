import { z } from 'zod';

import { EchoSetRequirementSchema } from './echo-set';
import { EnemySchema } from './enemy';
import { AttackInstanceSchema, ModifierInstanceSchema } from './rotation';
import { TeamSchema } from './team';
import { RefineLevelSchema } from './weapon';

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

export const ResolveConfigSchema = z.object({
  sequence: z.number().min(0).max(6).optional(),
  refineLevel: RefineLevelSchema.optional(),
  activatedSetBonus: EchoSetRequirementSchema.optional(),
});

export type ResolveConfig = z.infer<typeof ResolveConfigSchema>;

export const ListCapabilitiesRequestSchema = z.object({
  entityIds: z.array(z.int().positive()).min(1),
});

export type ListCapabilitiesRequest = z.infer<typeof ListCapabilitiesRequestSchema>;

export const ListSkillsRequestSchema = z.object({
  entityIds: z
    .array(z.int().positive())
    .min(1)
    .describe('The non-empty list of entity IDs to fetch skills for'),
});

export type ListSkillsRequest = z.infer<typeof ListSkillsRequestSchema>;
