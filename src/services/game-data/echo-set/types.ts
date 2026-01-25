import { z } from 'zod';

import type { Buff as ClientModifier } from '@/schemas/rotation';

import type { BaseEntity, Modifiers, PermanentStats } from '../common-types';

export const SetEffectRequirement = ['2', '3', '5'] as const;

export type SetEffectRequirement = (typeof SetEffectRequirement)[number];

export interface SetEffect {
  /**
   * Temporary or conditional buffs that can be triggered while a set effect is active.
   */
  modifiers: Modifiers;
  /**
   * Permanent stat nodes while a set effect is active
   */
  stats: PermanentStats;
}

export interface EchoSet extends BaseEntity {
  setEffects: Partial<Record<SetEffectRequirement, SetEffect>>;
}

export const GetClientEchoSetDetailsInputSchema = z.object({
  id: z.string(),
  requirement: z.enum(SetEffectRequirement),
});

export type GetClientEchoSetDetailsInput = z.infer<
  typeof GetClientEchoSetDetailsInputSchema
>;

export interface GetClientEchoSetDetailsOutput {
  modifiers: Array<Omit<ClientModifier, 'id' | 'characterName'>>;
}
