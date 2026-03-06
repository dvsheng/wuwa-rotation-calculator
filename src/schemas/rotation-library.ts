import { z } from 'zod';

import { SavedRotationDataSchema, SavedRotationSchema } from '@/schemas/library';

const OwnerIdSchema = z.string().trim().min(1);

export const ListRotationsRequestSchema = z.object({
  ownerId: OwnerIdSchema.optional(),
});

export type ListRotationsRequest = z.infer<typeof ListRotationsRequestSchema>;

export const CreateRotationRequestSchema = z.object({
  ownerId: OwnerIdSchema,
  name: z.string(),
  description: z.string().optional(),
  totalDamage: z.number().optional(),
  data: SavedRotationDataSchema,
});

export type CreateRotationRequest = z.infer<typeof CreateRotationRequestSchema>;

export const UpdateRotationRequestSchema = z
  .object({
    ownerId: OwnerIdSchema,
    id: z.number(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    totalDamage: z.number().optional(),
    data: SavedRotationDataSchema.optional(),
  })
  .superRefine((value, context) => {
    if (
      value.name === undefined &&
      value.description === undefined &&
      value.totalDamage === undefined &&
      value.data === undefined
    ) {
      context.addIssue({
        code: 'custom',
        message: 'At least one updatable field must be provided',
        path: ['id'],
      });
    }
  });

export type UpdateRotationRequest = z.infer<typeof UpdateRotationRequestSchema>;

export const DeleteRotationRequestSchema = z.object({
  ownerId: OwnerIdSchema,
  id: z.number(),
});

export type DeleteRotationRequest = z.infer<typeof DeleteRotationRequestSchema>;

export const ListRotationsResponseSchema = z.array(SavedRotationSchema);
export type ListRotationsResponse = z.infer<typeof ListRotationsResponseSchema>;

export const DeleteRotationResponseSchema = z.object({
  success: z.literal(true),
});

export type DeleteRotationResponse = z.infer<typeof DeleteRotationResponseSchema>;
