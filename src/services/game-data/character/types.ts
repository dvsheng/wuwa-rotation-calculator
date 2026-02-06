import type { Attribute } from '@/types';

import type {
  Attack,
  AttackOriginType,
  BaseEntity,
  GetClientEntityDetailsOutput,
  Modifier,
  OriginType,
  PermanentStat,
} from '../common-types';

/**
 * The Resonance Chain sequence at which a skill or bonus is unlocked.
 */
export const Sequence = {
  S1: 's1',
  S2: 's2',
  S3: 's3',
  S4: 's4',
  S5: 's5',
  S6: 's6',
} as const;

export type Sequence = (typeof Sequence)[keyof typeof Sequence];

/**
 * Base properties shared by all character capabilities.
 */
interface CharacterCapabilityBase {
  /** Name of the capability */
  name: string;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName: string;
  /** Where this capability originates from in the character's kit */
  originType: Exclude<OriginType, 'Weapon' | 'Echo' | 'Echo Set'>;
  /** The sequence to unlock this entry. If undefined, it's part of the base kit. */
  unlockedAt?: Sequence;
}

/**
 * Fields that can be overridden in an alternative definition (excludes id and alternativeDefinition).
 */
type CharacterAttack = Omit<
  Attack<CharacterCapabilityBase>,
  'attribute' | 'originType'
> & { originType: Exclude<AttackOriginType, 'Weapon' | 'Echo' | 'Echo Set'> };

type CharacterChildAttack = Pick<
  CharacterAttack,
  'description' | 'motionValues' | 'tags'
>;

type CharacterParentAttack = CharacterAttack & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildAttack>>;
};

type CharacterModifier = Modifier & CharacterCapabilityBase;

type CharacterChildModifier = Pick<
  CharacterModifier,
  'description' | 'target' | 'modifiedStats'
>;

type CharacterParentModifier = CharacterModifier & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildModifier>>;
};

/**
 * A character modifier with optional sequence-based alternatives.
 */
type CharacterPermanentStat = PermanentStat & CharacterCapabilityBase;

type CharacterChildPermanentStat = Pick<
  CharacterPermanentStat,
  'description' | 'value' | 'tags' | 'stat'
>;

/**
 * A character permanent stat with optional sequence-based alternatives.
 */
type CharacterParentPermanentStat = CharacterPermanentStat & {
  alternativeDefinitions?: Partial<Record<Sequence, CharacterChildPermanentStat>>;
};

/**
 * Container for all character capabilities.
 */
export interface CharacterCapabilities {
  attacks: Array<CharacterParentAttack>;
  modifiers: Array<CharacterParentModifier>;
  permanentStats: Array<CharacterParentPermanentStat>;
}

/**
 * Representation of a Character as stored in JSON files.
 */
export interface StoreCharacter extends BaseEntity {
  /** Elemental attribute of the character (e.g., Fusion, Glacio) */
  attribute: Attribute;
  /** Collection of attacks, modifiers, and stats for this character */
  capabilities: CharacterCapabilities;
}

/**
 * Resolved character with attribute added to attacks.
 */
export interface Character extends Omit<StoreCharacter, 'capabilities'> {
  capabilities: {
    attacks: Array<
      Attack & { name: string; parentName: string; originType: AttackOriginType }
    >;
    modifiers: CharacterCapabilities['modifiers'];
    permanentStats: CharacterCapabilities['permanentStats'];
  };
}

/**
 * Representation of a Character returned through client-facing character details REST service
 */
export interface GetClientCharacterDetailsOutput extends GetClientEntityDetailsOutput {
  id: string;
  /** Name of the character */
  name: string;
}
