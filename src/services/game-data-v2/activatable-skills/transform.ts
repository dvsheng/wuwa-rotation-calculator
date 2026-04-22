import type { SkillInfoRow } from '../repostiory';

import { SKILL_GENRE_TO_TYPE_MAP } from './constants';
import type { ActivatableSkill } from './types';

export function transform(row: SkillInfoRow): ActivatableSkill {
  return {
    id: row.skillId,
    name: row.rowData.SkillName,
    skillType:
      SKILL_GENRE_TO_TYPE_MAP[
        Number(row.rowData.SkillGenre.replaceAll(/\D/g, '')) as keyof typeof SKILL_GENRE_TO_TYPE_MAP
      ] ?? 'Unknown',
    montages: row.rowData.Animations.flatMap((animation) => {
      const path = animation.AssetPathName;
      const components = path.split('/');
      const characterName = getMontageCharacterName(path, row.skillId, components);
      const montageName = components.at(-1)?.split('.').at(-1);
      if (!characterName || !montageName) return [];
      return `${montageName}-${characterName}`;
    }),
    buffs: {
      onStart: row.rowData.SkillStartBuff,
      onEnd: row.rowData.SkillEndBuff,
      whileActive: row.rowData.SkillBuff,
    },
    tags: row.rowData.SkillTag.map((tag) => tag.TagName),
    groupId: row.rowData.GroupId,
    toughRatio: row.rowData.ToughRatio,
  };
}

const getMontageCharacterName = (
  path: string,
  skillId: number,
  components: Array<string>,
): string | undefined => {
  if (path.includes('/Character/Vision/')) {
    return String(skillId).slice(0, 6);
  }

  return components.at(-3);
};
