import type { OriginType } from '@/services/game-data/types';

export const iconSize = { sm: 14, md: 16, lg: 20, xl: 24 } as const;

export const SKILL_ORIGIN_ORDER: Array<OriginType> = [
  'Base Stats',
  'Normal Attack',
  'Resonance Skill',
  'Resonance Liberation',
  'Forte Circuit',
  'Intro Skill',
  'Outro Skill',
  'Inherent Skill',
  'Tune Break',
  'Echo',
  'Weapon',
  'Echo Set',
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
];
