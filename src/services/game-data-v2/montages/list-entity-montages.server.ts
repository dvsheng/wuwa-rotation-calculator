import { EntityType } from '@/services/game-data/types';

import { montageAssets, reBulletDataMainRows, skillInfoAssets } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

import { buildMontageSkillMap, buildReBulletDataMainMap, toMontage } from './transform';
import type { CharacterMontage } from './types';

async function listCharacterMontages(
  entityId: number,
): Promise<Array<CharacterMontage>> {
  const [allSkillInfoAssets, allMontages, allReBulletDataMainRows, entitySkills] =
    await Promise.all([
      skillInfoAssets.list(),
      montageAssets.list(),
      reBulletDataMainRows.list(),
      listEntitySkillsHandler(entityId, EntityType.CHARACTER),
    ]);

  const matchingSkillInfoAssets = allSkillInfoAssets.filter((asset) => {
    const rows =
      asset.Rows && typeof asset.Rows === 'object' && !Array.isArray(asset.Rows)
        ? Object.keys(asset.Rows)
        : [];
    return rows.some((rowId) => rowId.startsWith(String(entityId)));
  });

  if (matchingSkillInfoAssets.length === 0) {
    return [];
  }

  const montageSkillMap = new Map<string, Array<number>>();
  for (const asset of matchingSkillInfoAssets) {
    for (const [montageName, skillIds] of buildMontageSkillMap(asset)) {
      const existing = montageSkillMap.get(montageName) ?? [];
      montageSkillMap.set(montageName, [...existing, ...skillIds]);
    }
  }

  const skillById = new Map(
    entitySkills.map((skill) => [skill.gameId, skill] as const),
  );

  return allMontages
    .filter((montage) => montage.entityId === entityId)
    .map((montage) => {
      const reBulletDataMainById = buildReBulletDataMainMap(
        entityId,
        allReBulletDataMainRows,
      );
      const mappedSkillIds = montageSkillMap.get(montage.Name);
      const skillIds = mappedSkillIds
        ? [...new Set(mappedSkillIds)].toSorted((left, right) => left - right)
        : [];

      return {
        characterName: montage.characterName,
        montageName: montage.Name,
        skillIds,
        skills: skillIds.flatMap((skillId) => {
          const skill = skillById.get(skillId);
          if (!skill) return [];

          return [
            {
              gameId: skill.gameId,
              name: skill.name,
              originType: skill.originType,
            },
          ];
        }),
        montage: toMontage(montage, reBulletDataMainById),
      };
    })
    .toSorted((left, right) => left.montageName.localeCompare(right.montageName));
}

export async function listEntityMontagesHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<CharacterMontage>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return listCharacterMontages(entityId);
    }
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}
