import { EntityType } from '@/services/game-data/types';

import { createEntityResourceLister } from '../create-entity-resource-lister';
import { skillInfoRows } from '../repostiory';
import type { SkillInfoRow } from '../repostiory';

import type { ActivatableSkill } from './types';

export const listEntityActivatableSkillsHandler = createEntityResourceLister<
  SkillInfoRow,
  ActivatableSkill
>({
  fetchResourcesForEntity,
  transform,
});

async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<SkillInfoRow>> {
  if (entityType !== EntityType.CHARACTER) return [];
  const all = await skillInfoRows.list();
  return all.filter(
    (row) =>
      String(row.skillId).startsWith(String(entityId)) &&
      String(row.skillId).length >= 7,
  );
}

function transform(row: SkillInfoRow): ActivatableSkill {
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
