import { EntityType } from '@/services/game-data/types';

import { findCharacterNamesByEntityId } from '../character-entity-ids';
import { montageAssets } from '../repostiory';

import { toMontage } from './transform';
import type { Montage } from './types';

export async function listEntityMontagesHandler(
  entityId: number,
  entityType: EntityType,
): Promise<Array<Montage>> {
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

async function listCharacterMontages(entityId: number): Promise<Array<Montage>> {
  const characterNames = new Set(findCharacterNamesByEntityId(entityId));
  const allMontages = await montageAssets.list();

  return allMontages
    .filter((montage) => characterNames.has(montage.characterName))
    .map((rawMontage) => toMontage(rawMontage))
    .toSorted((left, right) => left.name.localeCompare(right.name));
}
