import type { SkillType } from './constants';

export interface ActivatableSkill {
  id: number;
  name: string;
  skillType: SkillType;
  montages: Array<string>;
  buffs: {
    onStart: Array<number>;
    onEnd: Array<number>;
    whileActive: Array<number>;
  };
  tags: Array<string>;
  groupId: number;
  toughRatio: number;
}
