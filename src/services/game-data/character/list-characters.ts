import { Attribute, WeaponType } from '@/types';

import { fetchCharacters } from '../hakushin-api/client';

export interface ListCharactersResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
  rarity: number;
  attribute: Attribute;
}

export type ListCharactersResponse = Array<ListCharactersResponseItem>;

const WEAPON_TYPE_MAP: Record<number, WeaponType> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
};

const ATTRIBUTE_MAP: Record<number, Attribute> = {
  1: Attribute.GLACIO,
  2: Attribute.FUSION,
  3: Attribute.ELECTRO,
  4: Attribute.AERO,
  5: Attribute.SPECTRO,
  6: Attribute.HAVOC,
};

export const listCharacters = async (
  weaponType?: WeaponType,
): Promise<ListCharactersResponse> => {
  const characters = await fetchCharacters();
  const list = Object.entries(characters).map(([id, char]) => ({
    id: Number.parseInt(id),
    name: char.en,
    weaponType: WEAPON_TYPE_MAP[char.weapon],
    rarity: char.rank,
    attribute: ATTRIBUTE_MAP[char.element],
  }));

  if (weaponType) {
    return list.filter((char) => char.weaponType === weaponType);
  }

  return list;
};

export const getCharacterIdByName = async (
  name: string,
): Promise<string | undefined> => {
  const characters = await fetchCharacters();
  const entry = Object.entries(characters).find(([_id, char]) => char.en === name);
  return entry ? entry[0] : undefined;
};
