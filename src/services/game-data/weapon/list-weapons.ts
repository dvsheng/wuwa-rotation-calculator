import { WeaponType } from '@/types';

import { fetchWeapons } from '../hakushin-api/client';

export interface ListWeaponsResponseItem {
  id: string;
  name: string;
  weaponType: WeaponType;
  rarity: number;
}

export type ListWeaponsResponse = Array<ListWeaponsResponseItem>;

const WEAPON_TYPE_MAP: Record<number, WeaponType> = {
  1: WeaponType.BROADBLADE,
  2: WeaponType.SWORD,
  3: WeaponType.PISTOLS,
  4: WeaponType.GAUNTLETS,
  5: WeaponType.RECTIFIER,
};

export const listWeapons = async (
  weaponType?: string,
): Promise<ListWeaponsResponse> => {
  const weapons = await fetchWeapons();
  const list = Object.entries(weapons).map(([id, weapon]) => ({
    id,
    name: weapon.en,
    weaponType: WEAPON_TYPE_MAP[weapon.type],
    rarity: weapon.rank,
  }));
  if (weaponType) {
    return list.filter((weapon) => weapon.weaponType === weaponType);
  }
  return list;
};

export const getWeaponIdByName = async (name: string): Promise<string | undefined> => {
  const weapons = await fetchWeapons();
  const entry = Object.entries(weapons).find(([_id, weapon]) => weapon.en === name);
  return entry ? entry[0] : undefined;
};
