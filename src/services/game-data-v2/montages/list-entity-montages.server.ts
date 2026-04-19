import { EntityType } from '@/services/game-data/types';

import { findCharacterNamesByEntityId } from '../character-entity-ids';
import { createEntityResourceLister } from '../create-entity-resource-lister';
import { montageAssets } from '../repostiory';
import type { MontageAsset } from '../repostiory';

import { toMontage } from './transform';

export const listEntityMontagesHandler = createEntityResourceLister({
  fetchResourcesForEntity: fetchMontageRowsForEntity,
  fetchContextForEntity: fetchMontageContextForEntity,
  transform: toMontage,
  filter: (_montage, row, context) => context.characterNames.has(row.characterName),
});

type MontageContext = {
  characterNames: Set<string>;
};

async function fetchMontageRowsForEntity(
  _entityId: number,
  entityType: EntityType,
): Promise<Array<MontageAsset>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const allMontages = await montageAssets.list();
      return allMontages.toSorted((left, right) => left.name.localeCompare(right.name));
    }
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}

function fetchMontageContextForEntity(
  entityId: number,
  entityType: EntityType,
): MontageContext {
  return {
    characterNames:
      entityType === EntityType.CHARACTER
        ? new Set(findCharacterNamesByEntityId(entityId))
        : new Set(),
  };
}
