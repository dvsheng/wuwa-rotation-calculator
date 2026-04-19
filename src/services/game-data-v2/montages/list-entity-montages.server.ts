import { EntityType } from '@/services/game-data/types';

import { findCharacterNamesByEntityId } from '../character-entity-ids';
import { createEntityResourceLister } from '../create-entity-resource-lister';
import { montageAssets } from '../repostiory';
import type { MontageAsset } from '../repostiory';

import { toMontage } from './transform';

export const listEntityMontagesHandler = createEntityResourceLister({
  fetchResourcesForEntity: fetchMontageRowsForEntity,
  transform: toMontage,
});

async function fetchMontageRowsForEntity(
  _entityId: number,
  entityType: EntityType,
): Promise<Array<MontageAsset>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const allMontages = await montageAssets.list();
      const characterNames = new Set(findCharacterNamesByEntityId(_entityId));
      return allMontages.filter((montage) => characterNames.has(montage.characterName));
    }
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}
