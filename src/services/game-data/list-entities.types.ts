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

export type ListEntityResponseItem =
  | ListCharactersResponseItem
  | ListWeaponsResponseItem
  | ListEchoesResponseItem
  | ListEchoSetsResponseItem;

export interface ListEntitiesResponse {
  characters: Array<ListCharactersResponseItem>;
  weapons: Array<ListWeaponsResponseItem>;
  echoes: Array<ListEchoesResponseItem>;
  echoSets: Array<ListEchoSetsResponseItem>;
}

export type { ListEntitiesRequest } from '@/schemas/game-data-service';
