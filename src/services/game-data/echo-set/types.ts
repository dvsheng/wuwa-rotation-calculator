import { z } from 'zod';

import { GetEntityDetailsInputSchema } from '../common-types';
import type {
  BaseEntity,
  Capabilities,
  GetClientEntityDetailsOutput,
} from '../common-types';

/**
 * Valid set piece counts for triggering echo set effects.
 */
export const SetEffectRequirement = ['2', '3', '5'] as const;

export type SetEffectRequirement = (typeof SetEffectRequirement)[number];

/**
 * Representation of an Echo Set as stored in JSON files.
 */
export interface StoreEchoSet extends BaseEntity {
  /** Map of piece requirements to their respective effects (Capabilities) */
  setEffects: Partial<Record<SetEffectRequirement, Capabilities>>;
}

/**
 * Zod schema for echo set details service input.
 */
export const GetEchoSetDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The number of pieces equipped from this set */
  requirement: z.enum(SetEffectRequirement),
});

/**
 * Input for fetching echo set details.
 */
export type GetEchoSetDetailsInput = z.infer<typeof GetEchoSetDetailsInputSchema>;

/**
 * Output format for client-facing echo set details.
 */
export type GetClientEchoSetDetailsOutput = GetClientEntityDetailsOutput;

/**
 * Representation of an Echo Set at a specific requirement level.
 */
export interface EchoSet extends BaseEntity {
  /** The active effects for the specified requirement */
  capabilities: Capabilities;
}
