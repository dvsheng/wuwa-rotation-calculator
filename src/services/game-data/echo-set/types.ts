import { z } from 'zod';

import type { BaseEntity, Capabilities } from '../common-types';

export const SetEffectRequirement = ['2', '3', '5'] as const;

export type SetEffectRequirement = (typeof SetEffectRequirement)[number];

export interface EchoSet extends BaseEntity {
  setEffects: Partial<Record<SetEffectRequirement, Capabilities>>;
}

export const GetEchoSetDetailsInputSchema = z.object({
  id: z.string(),
  requirement: z.enum(SetEffectRequirement),
});

export type GetEchoSetDetailsInput = z.infer<typeof GetEchoSetDetailsInputSchema>;
