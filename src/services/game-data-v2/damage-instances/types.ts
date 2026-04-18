import type { AttackScalingProperty, Attribute, DamageType, Tag } from '@/types';

/**
 * Representation of a single row of Damage in game data
 * All values should be directly and unquestionably inferrable from the row
 * i.e. enum mappings, simple math, etc.
 */
export interface DamageInstance {
  id: number;
  motionValue: number;
  motionValuePerStack?: number;
  attribute: Attribute;
  type: DamageType;
  subtypes: Array<Tag>;
  scalingAttribute: AttackScalingProperty;
  offTuneBuildup: number;
  energy: number;
  concertoRegen: number;
}
