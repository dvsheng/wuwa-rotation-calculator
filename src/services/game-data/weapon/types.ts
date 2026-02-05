import { z } from 'zod';

import type { AbilityAttribute, CharacterStat, EnemyStat } from '@/types';

import { GetEntityDetailsInputSchema } from '../common-types';
import type {
  BaseCapability,
  BaseEntity,
  Capabilities,
  GetClientEntityDetailsOutput,
  Target,
} from '../common-types';

/**
 * Valid weapon refinement levels (1 through 5).
 */
export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

// --- Refine-Scalable Types ---

/**
 * A number that scales linearly with weapon refinement level.
 * Resolves to: base + (refineLevel - 1) * increment
 */
export interface RefineScalableNumber {
  base: number;
  increment: number;
}

/**
 * A number in stored weapon data that may scale with refine level.
 */
export type StoredNumber = number | RefineScalableNumber;

/**
 * LinearScalingParameterConfig with refine-scalable numbers.
 */
export interface StoredLinearScalingParameterConfig {
  scale: StoredNumber;
  minimum?: StoredNumber;
  maximum?: StoredNumber;
}

/**
 * UserParameterizedNumber with refine-scalable numbers.
 */
export interface StoredUserParameterizedNumber {
  minimum?: StoredNumber;
  maximum?: StoredNumber;
  parameterConfigs: Partial<Record<string, StoredLinearScalingParameterConfig>>;
  offset?: StoredNumber;
}

/**
 * RotationRuntimeResolvableNumber with refine-scalable numbers.
 */
export interface StoredRotationRuntimeResolvableNumber extends StoredUserParameterizedNumber {
  resolveWith: string;
}

/**
 * Value type for stored weapon stats.
 */
export type StoredStatValue =
  | StoredNumber
  | StoredUserParameterizedNumber
  | StoredRotationRuntimeResolvableNumber;

/**
 * Stat with refine-scalable values.
 */
export interface StoredStat {
  stat: CharacterStat | EnemyStat;
  value: StoredStatValue;
  tags: Array<string>;
}

/**
 * PermanentStat with refine-scalable values.
 */
export interface StoredPermanentStat extends StoredStat, BaseCapability {}

/**
 * Modifier with refine-scalable values.
 */
export interface StoredModifier extends BaseCapability {
  target: Target;
  modifiedStats: Array<StoredStat>;
}

/**
 * Attack with refine-scalable motion values.
 */
export interface StoredAttack extends BaseCapability {
  scalingStat: AbilityAttribute;
  motionValues: Array<StoredNumber | StoredUserParameterizedNumber>;
  tags: Array<string>;
}

/**
 * Capabilities container with refine-scalable values.
 */
export interface StoredCapabilities {
  attacks: Array<StoredAttack>;
  modifiers: Array<StoredModifier>;
  permanentStats: Array<StoredPermanentStat>;
}

/**
 * The core Weapon data structure as stored in JSON files.
 * Uses refine-scalable numbers instead of per-level capabilities.
 */
export interface StoreWeapon extends BaseEntity {
  capabilities: StoredCapabilities;
}

/**
 * Zod schema for weapon details service input.
 */
export const GetWeaponDetailsInputSchema = GetEntityDetailsInputSchema.extend({
  /** The refinement level of the weapon (1-5) */
  refineLevel: z.enum(RefineLevel),
});

/**
 * Input for fetching weapon details.
 */
export type GetWeaponDetailsInput = z.infer<typeof GetWeaponDetailsInputSchema>;

/**
 * Output format for client-facing weapon details.
 */
export type GetClientWeaponDetailsOutput = GetClientEntityDetailsOutput;

/**
 * Representation of a Weapon at a specific refinement level.
 */
export interface Weapon extends BaseEntity {
  /** The active effects for the specified refinement level */
  capabilities: Capabilities;
}
