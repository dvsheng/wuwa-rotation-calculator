import type { Capability } from '@/schemas/rotation';
import type {
  AbilityAttribute,
  Attribute,
  CharacterStat,
  EnemyStat,
  RotationRuntimeResolvableNumber,
  Tagged,
  Target,
  UserParameterizedNumber,
} from '@/types';

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
  attribute: Attribute;
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

export type ClientCapability = Omit<Capability, 'characterId' | 'characterName'>;

export interface GetClientEntityDetailsOutput {
  attacks: Array<ClientCapability>;
  modifiers: Array<ClientCapability>;
}

export interface GetEntityDetailsOutput extends BaseEntity {
  capabilities: Capabilities;
}
