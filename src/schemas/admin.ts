import { z } from 'zod';

import type {
  DatabaseEntity,
  DatabaseFullCapability,
  DatabaseSkill,
} from '@/db/schema';
import { DatabaseCapabilitySchema } from '@/schemas/database';
import { CapabilityType, EntityType } from '@/services/game-data/types';

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
  skills: z.array(z.custom<DatabaseSkill>()),
  rows: z.array(z.custom<DatabaseFullCapability>()),
});

export type AdminEntityDetailsResponse = z.infer<
  typeof AdminEntityDetailsResponseSchema
>;

export const AdminUpdateCapabilityRequestSchema = z
  .object({
    capabilityId: z.number().int().positive(),
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    capabilityType: z.enum(CapabilityType),
    capabilityJson: DatabaseCapabilitySchema,
  })
  .superRefine((value, context) => {
    if (value.capabilityJson.type !== value.capabilityType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Capability type must match capabilityJson.type',
        path: ['capabilityType'],
      });
    }
  });

export type AdminUpdateCapabilityRequest = z.infer<
  typeof AdminUpdateCapabilityRequestSchema
>;
