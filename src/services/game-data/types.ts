import type {
  AbilityAttribute,
  Attribute,
  CharacterStat,
  EnemyStat,
  LinearParameterizedNumber,
  Tagged,
  UserParameterizedNumber,
} from '@/types';

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
}

export interface GameDataRotationRuntimeResolvableNumber extends LinearParameterizedNumber<
  CharacterStat | EnemyStat | AbilityAttribute
> {
  /**
   * The reference to the character whose stats are used to resolve the value at rotation runtime.
   */
  resolveWith: 'self';
}

/**
 * Internal base for permanent stats.
 */
export interface PermanentStatBase extends Tagged {
  /** The specific stat being modified */
  stat: CharacterStat | EnemyStat;
  /** The value of the stat, which can be a literal number or a resolvable parameter */
  value: number | GameDataRotationRuntimeResolvableNumber;
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
 * A stat and its value on a character or enemy for a modifier.
 */
export interface ModifierStat extends Tagged {
  /** The specific stat being modified */
  stat: CharacterStat | EnemyStat;
  /** The value of the stat, which can be a literal number or a resolvable parameter. Modifier stats can also be user-parameterized. */
  value: number | GameDataRotationRuntimeResolvableNumber | UserParameterizedNumber;
}

/**
 * Internal base for modifiers.
 */
interface ModifierBase extends BaseCapability {
  /** The entity this modifier applies to (e.g., Self, Team, Enemy) */
  target: Target;
  /** The list of stats modified by this effect */
  modifiedStats: Array<ModifierStat>;
}

/**
 * A temporary or conditional effect that modifies stats.
 */
export type Modifier<T = {}> = ModifierBase & T;

/**
 * Internal base for attacks.
 */
interface AttackBase extends BaseCapability {
  /** The stat used for damage scaling (e.g., ATK, DEF, HP) */
  scalingStat: AbilityAttribute;
  /** The elemental attribute of the damage */
  attribute: Attribute;
  /** The multipliers for each level of the attack */
  motionValues: Array<number | UserParameterizedNumber>;
  /** Tags identifying the type of attack (e.g., Basic Attack, Resonance Skill) */
  tags: Array<string>;
}

/**
 * An offensive capability that deals damage based on a character's permanent stats and active modifiers.
 */
export type Attack<T = {}> = AttackBase & T;

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

/**
 * Base properties for game entities like Characters, Weapons, or Echoes.
 */
export interface BaseEntity<T = {}> {
  /** Internal ID for the entity */
  id: number;
  /** Original game ID from Hakushin */
  hakushinId?: number;
  /** Name of the entity */
  name: string;
  capabilities: Capabilities<T>;
}
