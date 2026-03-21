import { z } from 'zod';

import { ListedRotationSchema, SavedRotationSchema } from '@/schemas/library';

const MutableRotationFieldsSchema = SavedRotationSchema.pick({
  name: true,
  description: true,
  totalDamage: true,
  visibility: true,
  data: true,
});

export const CreateRotationRequestSchema = MutableRotationFieldsSchema.omit({
  visibility: true,
});

export type CreateRotationRequest = z.infer<typeof CreateRotationRequestSchema>;

export const UpdateRotationRequestSchema = z
  .object({
    id: SavedRotationSchema.shape.id,
  })
  .merge(MutableRotationFieldsSchema.partial())
  .superRefine((value, context) => {
    if (
      value.name === undefined &&
      value.description === undefined &&
      value.totalDamage === undefined &&
      value.visibility === undefined &&
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
  id: z.number(),
});

export type DeleteRotationRequest = z.infer<typeof DeleteRotationRequestSchema>;

export const GetRotationByIdRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type GetRotationByIdRequest = z.infer<typeof GetRotationByIdRequestSchema>;

export const ListRotationsRequestSchema = z.object({
  scope: z.enum(['owned', 'public']),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().max(100).default(20),
  characterIds: z.array(z.number().int().positive()).optional(),
});

export type ListRotationsRequest = z.infer<typeof ListRotationsRequestSchema>;

export const ListRotationsResponseSchema = z.object({
  items: z.array(ListedRotationSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
});

export type ListRotationsResponse = z.infer<typeof ListRotationsResponseSchema>;

export const DeleteRotationResponseSchema = z.object({
  success: z.literal(true),
});

export type DeleteRotationResponse = z.infer<typeof DeleteRotationResponseSchema>;
