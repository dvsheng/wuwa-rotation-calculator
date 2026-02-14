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

export type { ListEntitiesRequest } from '@/schemas/game-data-service';
