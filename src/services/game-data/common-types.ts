import type {
  RotationRuntimeResolvableNumber,
  UserParameterizedNumber,
} from '@/types/parameterized-number';
import type {
  AbilityAttribute,
  CharacterStat,
  EnemyStat,
  Tagged,
  Target,
} from '@/types/server';

export interface BaseCapability {
  id: string;
  description: string;
}

export interface Stat extends Tagged {
  stat: CharacterStat | EnemyStat;
  value: number | RotationRuntimeResolvableNumber | UserParameterizedNumber;
  tags: Array<string>;
}

interface PermanentStatBase extends Stat, BaseCapability {}

export type PermanentStat<T = {}> = PermanentStatBase & T;

interface ModifierBase extends BaseCapability {
  target: Target;
  modifiedStats: Array<Stat>;
}

export type Modifier<T = {}> = ModifierBase & T;

interface AttackBase extends BaseCapability {
  scalingStat: AbilityAttribute;
  motionValues: Array<number | UserParameterizedNumber>;
  tags: Array<string>;
}

export type Attack<T = {}> = AttackBase & T;

export interface Capabilities<T = {}> {
  attacks: Array<Attack<T>>;
  modifiers: Array<Modifier<T>>;
  permanentStats: Array<PermanentStat<T>>;
}

export interface BaseEntity {
  id: string;
  uuid: string;
  name: string;
}

export interface ClientCapability {
  id: string;
  name: string;
  parentName: string;
  description?: string;
  parameters?: Array<{ minimum: number; maximum: number }>;
}

export interface GetClientEntityDetailsOutput {
  attacks: Array<ClientCapability>;
  modifiers: Array<ClientCapability>;
}
