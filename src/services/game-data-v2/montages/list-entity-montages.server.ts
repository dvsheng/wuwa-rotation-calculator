import { EntityType } from '@/services/game-data/types';

import { montageAssets, skillInfoAssets } from '../repostiory';
import { listEntitySkillsHandler } from '../skills/list-entity-skills.server';

import { buildMontageSkillMap, toMontage } from './transform';
import type { CharacterMontage } from './types';

async function listCharacterMontages(
  entityId: number,
): Promise<Array<CharacterMontage>> {
  const [allSkillInfoAssets, allMontages, entitySkills] = await Promise.all([
    skillInfoAssets.list(),
    montageAssets.list(),
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
    .map((rawMontage) => {
      const mappedSkillIds = montageSkillMap.get(rawMontage.name);
      const skillIds = mappedSkillIds
        ? [...new Set(mappedSkillIds)].toSorted((left, right) => left - right)
        : [];
      const montage = toMontage(rawMontage);

      return {
        characterName: rawMontage.characterName,
        montageName: montage.name,
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
        montage,
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
