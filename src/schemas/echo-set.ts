import { z } from 'zod';

export const EchoSetSchema = z.object({
  id: z.number(),
  requirement: z.enum(['2', '3', '5']),
});

export type EchoSet = z.infer<typeof EchoSetSchema>;
