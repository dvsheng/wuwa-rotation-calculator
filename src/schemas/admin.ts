import { z } from 'zod';

import { CapabilityDataSchema } from '@/services/game-data';

export const UpdateCapabilityRequestSchema = z.object({
  capabilityId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  capabilityJson: CapabilityDataSchema,
});

export const CreateCapabilityRequestSchema = z.object({
  skillId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  capabilityJson: CapabilityDataSchema,
});

export const DeleteCapabilityRequestSchema = z.object({
  capabilityId: z.number().int().positive(),
});

export type UpdateCapabilityRequest = z.infer<typeof UpdateCapabilityRequestSchema>;

export type CreateCapabilityRequest = z.infer<typeof CreateCapabilityRequestSchema>;

export type DeleteCapabilityRequest = z.infer<typeof DeleteCapabilityRequestSchema>;
