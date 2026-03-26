import { z } from 'zod';

import { CapabilityDataSchema } from '@/services/game-data';

export const AdminUpdateCapabilityRequestSchema = z.object({
  capabilityId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  capabilityJson: CapabilityDataSchema,
});

export type AdminUpdateCapabilityRequest = z.infer<
  typeof AdminUpdateCapabilityRequestSchema
>;
