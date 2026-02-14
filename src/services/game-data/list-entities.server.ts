import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { EntityType, entities } from '@/db/schema';
import type { ListEntitiesRequest } from '@/schemas/game-data-service';
import type { Attribute, WeaponType } from '@/types';

export interface ListCharactersResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
  rarity: number;
  attribute: Attribute;
}

export interface ListWeaponsResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
  rarity: number;
}

export interface ListEchoesResponseItem {
  id: number;
  name: string;
  cost: number;
  sets: Array<number>;
}

export interface EchoSetResponseItem {
  id: number;
  name: string;
  tiers: Array<number>;
}

export type ListEntitiesResponse =
  | Array<ListCharactersResponseItem>
  | Array<ListWeaponsResponseItem>
  | Array<ListEchoesResponseItem>
  | Array<EchoSetResponseItem>;

export const listEntitiesHandler = async (
  input: ListEntitiesRequest,
): Promise<ListEntitiesResponse> => {
  switch (input.entityType) {
    case EntityType.CHARACTER: {
      const characters = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.CHARACTER),
        columns: {
          hakushinId: true,
          name: true,
          weaponType: true,
          rank: true,
          attribute: true,
        },
      });

      const list = characters.map((char) => ({
        id: char.hakushinId!,
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
          hakushinId: true,
          name: true,
          weaponType: true,
          rank: true,
        },
      });

      const list = weapons.map((weapon) => ({
        id: weapon.hakushinId!,
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
          hakushinId: true,
          name: true,
          cost: true,
          echoSetIds: true,
        },
      });

      return echoes.map((echo) => ({
        id: echo.hakushinId!,
        name: echo.name,
        cost: echo.cost!,
        sets: echo.echoSetIds!,
      }));
    }

    case EntityType.ECHO_SET: {
      const echoSets = await database.query.entities.findMany({
        where: eq(entities.type, EntityType.ECHO_SET),
        columns: {
          hakushinId: true,
          name: true,
          setBonusThresholds: true,
        },
      });

      return echoSets.map((set) => ({
        id: set.hakushinId!,
        name: set.name,
        tiers: set.setBonusThresholds!,
      }));
    }
  }
};
