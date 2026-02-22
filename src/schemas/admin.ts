import { z } from 'zod';

import type { DatabaseEntity, DatabaseFullCapability } from '@/db/schema';
import { EntityType } from '@/services/game-data/types';

export const AdminListEntitiesRequestSchema = z.object({
  entityType: z.enum(EntityType).optional(),
  search: z.string().trim().optional(),
});

export type AdminListEntitiesRequest = z.infer<typeof AdminListEntitiesRequestSchema>;

export const AdminListEntitiesRowSchema = z.object({
  entity: z.custom<DatabaseEntity>(),
  skillCount: z.number().int().nonnegative(),
});

export type AdminListEntitiesRow = z.infer<typeof AdminListEntitiesRowSchema>;

export const AdminGetEntityDetailsRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type AdminGetEntityDetailsRequest = z.infer<
  typeof AdminGetEntityDetailsRequestSchema
>;

export const AdminEntityDetailsResponseSchema = z.object({
  entity: z.custom<DatabaseEntity>().optional(),
  rows: z.array(z.custom<DatabaseFullCapability>()),
});

export type AdminEntityDetailsResponse = z.infer<
  typeof AdminEntityDetailsResponseSchema
>;
