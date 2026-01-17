import { z } from 'zod';

export const EchoSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  requirement: z.enum(['2', '3', '5']).default('2'),
});

export type EchoSet = z.infer<typeof EchoSetSchema>;
