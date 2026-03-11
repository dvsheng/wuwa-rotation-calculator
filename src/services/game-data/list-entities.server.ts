import { database } from '@/db/client';

import type { ListEntitiesResponse } from './list-entities.types';
import { EntityType } from './types';

export const listEntitiesHandler = async (): Promise<ListEntitiesResponse> => {
  const rows = await database.query.entities.findMany();

  const catalog: ListEntitiesResponse = {
    characters: [],
    weapons: [],
    echoes: [],
    echoSets: [],
  };

  for (const row of rows) {
    switch (row.type) {
      case EntityType.CHARACTER: {
        catalog.characters.push({
          id: row.id,
          name: row.name,
          weaponType: row.weaponType!,
          rarity: row.rank!,
          attribute: row.attribute!,
          iconUrl: row.iconUrl ?? undefined,
        });
        break;
      }
      case EntityType.WEAPON: {
        catalog.weapons.push({
          id: row.id,
          name: row.name,
          weaponType: row.weaponType!,
          rarity: row.rank!,
          iconUrl: row.iconUrl ?? undefined,
        });
        break;
      }
      case EntityType.ECHO: {
        catalog.echoes.push({
          id: row.id,
          name: row.name,
          cost: row.cost!,
          sets: row.echoSetIds!,
          iconUrl: row.iconUrl ?? undefined,
        });
        break;
      }
      case EntityType.ECHO_SET: {
        catalog.echoSets.push({
          id: row.id,
          gameId: row.gameId!,
          name: row.name,
          tiers: row.setBonusThresholds!,
          iconUrl: row.iconUrl ?? undefined,
        });
        break;
      }
    }
  }

  return catalog;
};
