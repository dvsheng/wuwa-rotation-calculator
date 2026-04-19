import type { SkillInfoRow } from '../repostiory';

import type { ActivatableSkill } from './types';

export function transform(row: SkillInfoRow): ActivatableSkill {
  return {
    id: row.skillId,
    name: row.rowData.SkillName,
    genre: row.rowData.SkillGenre.replaceAll(/\D/g, ''),
    montages: row.rowData.Animations.flatMap((animation) => {
      const path = animation.AssetPathName;
      const components = path.split('/');
      const characterName = components.at(-3);
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
