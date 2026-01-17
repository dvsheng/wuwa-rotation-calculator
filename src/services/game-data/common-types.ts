import type {
  RotationRuntimeResolvableNumber,
  UserParameterizedNumber,
} from '@/types/parameterized-number';
import type { AbilityAttribute, CharacterStat, Modifier, Tagged } from '@/types/server';

export interface Describable {
  description: string;
}

export type ParameterizedNumber =
  | number
  | UserParameterizedNumber
  | RotationRuntimeResolvableNumber;

export interface Attack extends Describable, Tagged {
  scalingStat: AbilityAttribute;
  /** An attack will have at least one motion value or parmeterized motion value */
  motionValues?: Array<number>;
  parameterizedMotionValues?: Array<UserParameterizedNumber>;
}

export type Modifiers<T = unknown> = Array<
  Modifier<ParameterizedNumber & Tagged> & Describable & T
>;

export type PermanentStats<T = unknown> = Partial<
  Record<CharacterStat, Array<ParameterizedNumber & Describable & Tagged & T>>
>;

export interface BaseEntity {
  id: string;
  name: string;
}
