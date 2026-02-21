import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { ListEntitiesRequest } from '@/schemas/game-data-service';

import type { ListEntitiesResponse } from './list-entities.types';
import { EntityType } from './types';

export const listEntitiesHandler = async (
  input: ListEntitiesRequest,
): Promise<ListEntitiesResponse> => {
  switch (input.entityType) {
    case EntityType.CHARACTER: {
      const characters = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.CHARACTER),
        columns: {
          id: true,
          name: true,
          weaponType: true,
          rank: true,
          attribute: true,
        },
      });

      const list = characters.map((char) => ({
        id: char.id,
        name: char.name,
        weaponType: char.weaponType!,
        rarity: char.rank!,
        attribute: char.attribute!,
      }));

      if (input.weaponType) {
        return list.filter((char) => char.weaponType === input.weaponType);
      }

      return list;
    }

    case EntityType.WEAPON: {
      const weapons = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.WEAPON),
        columns: {
          id: true,
          name: true,
          weaponType: true,
          rank: true,
        },
      });

      const list = weapons.map((weapon) => ({
        id: weapon.id,
        name: weapon.name,
        weaponType: weapon.weaponType!,
        rarity: weapon.rank!,
      }));

      if (input.weaponType) {
        return list.filter((weapon) => weapon.weaponType === input.weaponType);
      }

      return list;
    }

    case EntityType.ECHO: {
      const echoes = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.ECHO),
        columns: {
          id: true,
          name: true,
          cost: true,
          echoSetIds: true,
        },
      });

      return echoes.map((echo) => ({
        id: echo.id,
        name: echo.name,
        cost: echo.cost!,
        sets: echo.echoSetIds!,
      }));
    }

    case EntityType.ECHO_SET: {
      const echoSets = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.ECHO_SET),
        columns: {
          id: true,
          gameId: true,
          name: true,
          setBonusThresholds: true,
        },
      });

      return echoSets.map((set) => ({
        id: set.id,
        gameId: set.gameId!,
        name: set.name,
        tiers: set.setBonusThresholds!,
      }));
    }
  }
};
