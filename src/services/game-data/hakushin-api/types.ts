export interface HakushinStats {
  Life: number;
  Atk: number;
  Def: number;
}

export interface HakushinSkillLevel {
  Name: string;
  Param: Array<Array<string>>;
  Format?: string | null;
}

export interface HakushinSkill {
  Name: string;
  Desc: string;
  SimpleDesc?: string;
  Type: string;
  Param?: Array<string>;
  SimpleParam?: Array<string>;
  Icon: string;
  Level?: Record<string, HakushinSkillLevel>;
}

export interface HakushinSkillNode {
  Skill: HakushinSkill;
}

export interface HakushinChain {
  Name: string;
  Desc: string;
  Param: Array<string>;
  Icon: string;
}

export interface HakushinCharacterDetail {
  Id: number;
  Name: string;
  Element: number;
  Weapon: number;
  Stats: Record<string, Record<string, HakushinStats>>;
  SkillTrees: Record<string, HakushinSkillNode>;
  Chains: Record<string, HakushinChain>;
}
