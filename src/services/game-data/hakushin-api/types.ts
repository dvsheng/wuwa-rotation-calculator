/**
 * Base stats as represented in the Hakushin API.
 */
export interface HakushinStats {
  /** Health points */
  Life: number;
  /** Attack power */
  Atk: number;
  /** Defense */
  Def: number;
}

/**
 * Details for a specific skill level in the Hakushin API.
 */
export interface HakushinSkillLevel {
  /** Name of the skill at this level */
  Name: string;
  /** Raw parameters for the skill, often containing scaling values */
  Param: Array<Array<string>>;
  /** Formatting string for displaying the skill parameters */
  Format?: string | null;
}

/**
 * Skill data from the Hakushin API.
 */
export interface HakushinSkill {
  /** Localized name of the skill */
  Name: string;
  /** Full description of the skill */
  Desc: string;
  /** Brief description of the skill */
  SimpleDesc?: string;
  /** Category of the skill (e.g., Normal Attack, Resonance Skill) */
  Type: string;
  /** Global parameters for the skill */
  Param?: Array<string>;
  /** Global simple parameters for the skill */
  SimpleParam?: Array<string>;
  /** Icon asset path */
  Icon: string;
  /** Scaling data for each skill level */
  Level?: Record<string, HakushinSkillLevel>;
}

/**
 * A node in the character's skill tree.
 */
export interface HakushinSkillNode {
  /** The skill associated with this node */
  Skill: HakushinSkill;
}

/**
 * Resonance chain (sequence/constellation) data from the Hakushin API.
 */
export interface HakushinChain {
  /** Name of the resonance chain node */
  Name: string;
  /** Description of the effect */
  Desc: string;
  /** Parameters for the effect */
  Param: Array<string>;
  /** Icon asset path */
  Icon: string;
}

/**
 * Comprehensive character data as returned by the Hakushin API.
 */
export interface HakushinCharacterDetail {
  /** Internal ID of the character */
  Id: number;
  /** Localized name of the character */
  Name: string;
  /** Internal ID of the elemental attribute */
  Element: number;
  /** Internal ID of the weapon type */
  Weapon: number;
  /** Stats indexed by level and promotion status */
  Stats: Record<string, Record<string, HakushinStats>>;
  /** Map of skill tree nodes */
  SkillTrees: Record<string, HakushinSkillNode>;
  /** Map of resonance chain nodes */
  Chains: Record<string, HakushinChain>;
}
