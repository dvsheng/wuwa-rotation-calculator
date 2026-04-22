export const SKILL_GENRE_TO_TYPE_MAP = {
  0: 'Basic Attack',
  1: 'Heavy Attack',
  2: 'Resonance Skill',
  3: 'Resonance Liberation',
  4: 'Intro Skill',
  5: 'Dodge',
  6: 'Passive',
  7: 'Echo Skill',
  8: 'Air Dodge',
  9: 'Outro Skill',
  10: 'Weakness Break',
  11: 'None',
} as const;

export type SkillType =
  | (typeof SKILL_GENRE_TO_TYPE_MAP)[keyof typeof SKILL_GENRE_TO_TYPE_MAP]
  | 'Unknown';
