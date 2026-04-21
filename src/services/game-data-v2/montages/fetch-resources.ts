import { EntityType } from '@/services/game-data/types';

import { echoes, montageAssets } from '../repostiory';
import type { MontageAsset } from '../repostiory';

import { WUWA_CHARACTER_ENTITY_IDS } from './constants';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<MontageAsset>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const allMontages = await montageAssets.list();
      const characterNames = new Set(findCharacterNamesByEntityId(entityId));
      return allMontages.filter((montage) => characterNames.has(montage.characterName));
    }
    case EntityType.ECHO: {
      const echo = await echoes.get(entityId);
      if (!echo) throw new Error('invalid id');

      const montageCharacterName = String(echo.skillId).slice(0, 6);
      const allMontages = await montageAssets.list();
      return allMontages.filter(
        (montage) => montage.characterName === montageCharacterName,
      );
    }
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

function findCharacterNamesByEntityId(entityId: number): Array<string> {
  return Object.entries(WUWA_CHARACTER_ENTITY_IDS)
    .filter(([, id]) => id === entityId)
    .map(([name]) => name);
}
