import { z } from 'zod';

import { DatabaseCapabilitySchema } from '@/schemas/database';

export const AdminGetEntityDetailsRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type AdminGetEntityDetailsRequest = z.infer<
  typeof AdminGetEntityDetailsRequestSchema
>;

export const AdminUpdateCapabilityRequestSchema = z.object({
  capabilityId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  capabilityJson: DatabaseCapabilitySchema,
});

export type AdminUpdateCapabilityRequest = z.infer<
  typeof AdminUpdateCapabilityRequestSchema
>;
