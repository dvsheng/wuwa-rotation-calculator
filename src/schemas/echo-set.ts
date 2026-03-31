import { z } from 'zod';

export const EchoSetRequirementSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(5),
]);

export const EchoSetSchema = z.object({
  id: z.number(),
  requirement: EchoSetRequirementSchema,
});

export type EchoSet = z.infer<typeof EchoSetSchema>;
