import type { AttackScalingProperty, Attribute, DamageType, Tag } from '@/types';

import type { EntityResource } from '../create-entity-resource-lister';
import type { Damage } from '../repostiory';

/**
 * Representation of a single row of Damage in game data
 * All values should be directly and unquestionably inferrable from the row
 * i.e. enum mappings, simple math, etc.
 */
export interface DamageInstanceData {
  id: number;
  motionValue: number;
  motionValuePerStack?: number;
  alternativeMotionValue?: {
    requiredTag: string;
    motionValue: number;
    motionValuePerStack: number;
  };
  attribute: Attribute;
  type: DamageType;
  subtypes: Array<Tag>;
  scalingAttribute: AttackScalingProperty;
  offTuneBuildup: number;
  energy: number;
  concertoRegen: number;
}

export type DamageInstance = EntityResource<DamageInstanceData, Damage>;
