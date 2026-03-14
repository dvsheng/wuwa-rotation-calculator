import type { EchoMainStatOptionType } from '@/schemas/echo';
import type {
  AttackScalingProperty,
  Attribute,
  CharacterStat,
  DamageType,
  EnemyStat,
  Tagged,
} from '@/types';

/**
 * Entity types supported in the database
 */
export const EntityType = {
  CHARACTER: 'character',
  WEAPON: 'weapon',
  ECHO: 'echo',
  ECHO_SET: 'echo_set',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

/**
 * Capability type enum
 */
export const CapabilityType = {
  ATTACK: 'attack',
  MODIFIER: 'modifier',
  PERMANENT_STAT: 'permanent_stat',
} as const;

export type CapabilityType = (typeof CapabilityType)[keyof typeof CapabilityType];

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
 * Valid weapon refinement levels (1 through 5).
 */
export const RefineLevel = ['1', '2', '3', '4', '5'] as const;

export type RefineLevel = (typeof RefineLevel)[number];

/**
 * Valid set piece counts for triggering echo set effects.
 */
export const SetEffectRequirement = {
  TWO: 2,
  THREE: 3,
  FIVE: 5,
};

export type SetEffectRequirement =
  (typeof SetEffectRequirement)[keyof typeof SetEffectRequirement];

/**
 * The source of a capability.
 *
 * A capability either comes from a character's abilities
 * or from external sources like weapons or echoes.
 */
export const OriginType = {
  /** Capabilities from the character's unique mechanic */
  FORTE_CIRCUIT: 'Forte Circuit',
  /** Standard weapon attacks */
  NORMAL_ATTACK: 'Normal Attack',
  /** Character's E skill */
  RESONANCE_SKILL: 'Resonance Skill',
  /** Character's R ability */
  RESONANCE_LIBERATION: 'Resonance Liberation',
  /** Attack performed when switching the character in */
  INTRO_SKILL: 'Intro Skill',
  /** Buff/Effect triggered when switching the character out */
  OUTRO_SKILL: 'Outro Skill',
  /** Passive abilities unlocked at character breakpoints */
  INHERENT_SKILL: 'Inherent Skill',
  /** Base stats of the character */
  BASE_STATS: 'Base Stats',
  /** Specialized mechanics for certain characters */
  TUNE_BREAK: 'Tune Break',
  ...Sequence,
  WEAPON: 'Weapon',
  ECHO: 'Echo',
  ECHO_SET: 'Echo Set',
} as const;

export type OriginType = (typeof OriginType)[keyof typeof OriginType];

export type AttackOriginType = Exclude<OriginType, 'Inherent Skill' | 'Base Stats'>;

/**
 * Base properties for any capability (Attack, Modifier, PermanentStat)
 */
export interface BaseCapability {
  /** Unique identifier for the capability */
  id: number;
  /** Name of the capability */
  name: string;
  /** Where this capability originates from in an entity */
  originType: OriginType;
  /** The name of the parent skill or node (e.g., "Ground State Calibration"). */
  parentName?: string;
  /** Description of the capability */
  description?: string;
  capabilityType: CapabilityType;
  /** Icon URL for this capability (coalesced from skill icon then entity icon) */
  iconUrl?: string;
}

// ============================================================================
// Game-data number types (after Tier 1 / refine-scalable resolution)
//
// All DatabaseLeafNumber values are plain `number` at this layer.
// DatabaseUserNumber  → GameDataUserNumber  (bounds now plain numbers)
// DatabaseNumberNode  → GameDataNumberNode  (same tree, no refine-scalable leaves)
//
// statParameterizedNumber still uses resolveWith: 'self' | 'enemy'; this is
// resolved to a concrete characterIndex at rotation-enrich time.
// ============================================================================

/** A user-parameterized number node after refine-scalable values are resolved. */
export interface GameDataUserParameterizedNumberNode {
  type: 'userParameterizedNumber';
  parameterId: '0' | '1' | '2';
  minimum?: number;
  maximum?: number;
}

/**
 * Tier-1-or-Tier-2 number at the game-data layer.
 * All refine-scalable numbers have been resolved to plain numbers.
 */
export type GameDataUserNumber = number | GameDataUserParameterizedNumberNode;

/** A stat-parameterized reference at the game-data layer. */
export interface GameDataStatParameterizedNumber {
  type: 'statParameterizedNumber';
  stat: CharacterStat | EnemyStat;
  /** Resolved to a concrete characterIndex at enrich time. */
  resolveWith: 'self' | 'enemy';
}

export const isGameDataStatParameterizedNumber = (
  value: unknown,
): value is GameDataStatParameterizedNumber =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  (value as Record<string, unknown>).type === 'statParameterizedNumber' &&
  'resolveWith' in value;

/**
 * Full expression tree at the game-data layer.
 * All refine-scalable numbers are plain numbers; user params and stat refs
 * are still present and resolved in subsequent pipeline steps.
 */
export type GameDataNumberNode<T = GameDataUserNumber> =
  | T
  | { type: 'sum'; operands: Array<GameDataNumberNode<T>> }
  | { type: 'product'; operands: Array<GameDataNumberNode<T>> }
  | {
      type: 'clamp';
      operand: T;
      minimum: T;
      maximum: T;
    }
  | {
      type: 'conditional';
      operand: T;
      operator: '>' | '>=' | '<' | '<=';
      threshold: T;
      valueIfTrue: T;
      valueIfFalse: T;
    }
  | GameDataStatParameterizedNumber;

/**
 * Internal base for permanent stats.
 */
export interface PermanentStatBase extends Tagged {
  /** The specific stat being modified */
  stat: CharacterStat | EnemyStat;
  /** The value of the stat — a full expression tree (may reference character/enemy stats). */
  value: GameDataNumberNode<number>;
}

/**
 * A permanent stat bonus, often from passive nodes, base stats, or equipment.
 */
export type PermanentStat<T = {}> = PermanentStatBase & BaseCapability & T;

/**
 * Defines the potential targets for a modifier.
 */
export const Target = {
  /** Applies to all characters in the current team. */
  TEAM: 'team',
  /** Applies to the enemy target. */
  ENEMY: 'enemy',
  /** Applies only to the character currently on field. */
  ACTIVE_CHARACTER: 'activeCharacter',
  SELF: 'self',
} as const;

export type Target = (typeof Target)[keyof typeof Target];

/**
 * A stat and its value on a character or enemy for a modifier, with its own target.
 */
export interface ModifierStat extends Tagged {
  /** The entity this stat applies to */
  target: Target;
  /** The specific stat being modified */
  stat: CharacterStat | EnemyStat;
  /** The value — a full expression tree (may be stat-dependent or user-parameterized). */
  value: GameDataNumberNode;
}

/**
 * Internal base for modifiers.
 */
interface ModifierBase extends BaseCapability {
  /** The list of stats modified by this effect, each with its own target */
  modifiedStats: Array<ModifierStat>;
}

/**
 * A temporary or conditional effect that modifies stats.
 */
export type Modifier<T = {}> = ModifierBase & T;

export interface AttackDamageInstance {
  /** Motion value — Tier 2 only: fixed, refine-scalable, or user-parameterized. */
  motionValue: GameDataUserNumber;
  /** The elemental attribute of this damage instance. */
  attribute: Attribute;
  /** The damage type of this instance (e.g. basicAttack, resonanceSkill). */
  damageType: DamageType;
  tags: Array<string>;
  scalingStat: AttackScalingProperty;
}

/**
 * Internal base for attacks.
 */
interface AttackBase extends BaseCapability {
  /** Individual damage instances, each with their own motion value, tags, and scaling stat */
  damageInstances: Array<AttackDamageInstance>;
}

/**
 * An offensive capability that deals damage based on a character's permanent stats and active modifiers.
 */
export type Attack<T = {}> = AttackBase & T;

export type Capability = Attack | Modifier | PermanentStat;

export const isAttack = (capability: Capability): capability is Attack => {
  return capability.capabilityType === CapabilityType.ATTACK;
};

export const isModifier = (capability: Capability): capability is Modifier => {
  return capability.capabilityType === CapabilityType.MODIFIER;
};

export const isPermanentStat = (
  capability: Capability,
): capability is PermanentStat => {
  return capability.capabilityType === CapabilityType.PERMANENT_STAT;
};

/**
 * Container for all types of capabilities associated with an entity.
 */
export interface Capabilities<T = {}> {
  /** List of offensive capabilities */
  attacks: Array<Attack<T>>;
  /** List of temporary/conditional stat modifiers */
  modifiers: Array<Modifier<T>>;
  /** List of permanent stat bonuses */
  permanentStats: Array<PermanentStat<T>>;
}

export interface CharacterDerivedAttributes {
  preferredScalingStat: 'atk' | 'def' | 'hp';
  dominantAttribute?: Attribute;
  preferredThreeCostScalingMainStat: EchoMainStatOptionType;
  preferredThreeCostAttributeMainStat?: EchoMainStatOptionType;
}

/**
 * Base properties for game entities like Characters, Weapons, or Echoes.
 */
export interface BaseEntity<T = {}> {
  /** Internal ID for the entity */
  id: number;
  /** Original game ID from Hakushin */
  gameId?: number;
  /** Name of the entity */
  name: string;
  /** Icon URL for this entity */
  iconUrl?: string;
  capabilities: Capabilities<T>;
}

export interface CharacterEntity<T = {}> extends BaseEntity<T> {
  derivedAttributes: CharacterDerivedAttributes;
}
