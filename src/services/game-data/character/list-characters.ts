import { WeaponType } from '@/types';

import { fetchCharacters } from '../hakushin-api/client';

interface ListCharactersResponseItem {
  id: number;
  name: string;
  weaponType: WeaponType;
}

export type ListCharactersResponse = Array<ListCharactersResponseItem>;

const WEAPON_TYPE_MAP: Record<number, WeaponType> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
};

export const listCharacters = async (
  weaponType?: WeaponType,
): Promise<ListCharactersResponse> => {
  const characters = await fetchCharacters();
  const list = Object.entries(characters).map(([id, char]) => ({
    id: Number(id),
    name: char.en,
    weaponType: WEAPON_TYPE_MAP[char.weapon],
  }));

  if (weaponType) {
    return list.filter((char) => char.weaponType === weaponType);
  }

  return list;
};

export const getCharacterIdByName = async (
  name: string,
): Promise<number | undefined> => {
  const characters = await fetchCharacters();
  const entry = Object.entries(characters).find(([_id, char]) => char.en === name);
  return entry ? Number(entry[0]) : undefined;
};
