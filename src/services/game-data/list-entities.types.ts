import type { Attribute, WeaponType } from '@/types';

export interface ListCharactersResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
  rarity: number;
  attribute: Attribute;
  iconUrl?: string;
}

export interface ListWeaponsResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
  rarity: number;
  iconUrl?: string;
}

export interface ListEchoesResponseItem {
  id: number;
  name: string;
  cost: number;
  sets: Array<number>;
  iconUrl?: string;
}

export interface ListEchoSetsResponseItem {
  id: number;
  gameId: number;
  name: string;
  tiers: Array<number>;
  iconUrl?: string;
}

export type ListEntitiesResponse =
  | Array<ListCharactersResponseItem>
  | Array<ListWeaponsResponseItem>
  | Array<ListEchoesResponseItem>
  | Array<ListEchoSetsResponseItem>;

export type { ListEntitiesRequest } from '@/schemas/game-data-service';
