import type { DataStore } from './fs-store';
import { createFsStore } from './fs-store';
import type { HakushinCharacterDetail } from './types';

const HAKUSHIN_API_BASE = 'https://api.hakush.in/ww/data';
const DEFAULT_LOCAL_DATA_PATH =
  typeof window === 'undefined' ? `${process.cwd()}/.local/data//` : '';

export const fsStore = createFsStore<any>(DEFAULT_LOCAL_DATA_PATH);

export interface HakushinCharacter {
  icon: string;
  rank: number;
  weapon: number;
  element: number;
  en: string;
  nickname: string;
  desc: string;
}

export type HakushinCharacterData = Record<string, HakushinCharacter>;

export const fetchDataPath =
  <T>(store: DataStore<T>, pathTemplate: string) =>
  async (...args: Array<string | number>): Promise<T> => {
    const apiPath = args.reduce<string>(
      (acc, arg, i) => acc.split(`{${i}}`).join(String(arg)),
      pathTemplate,
    );
    const cachedData = await store.get(apiPath);
    if (cachedData) {
      return cachedData;
    }
    console.log(`Store miss for ${apiPath}, fetching from API...`);
    const response = await fetch(`${HAKUSHIN_API_BASE}/${apiPath}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${apiPath}: ${response.statusText}`);
    }
    const data = (await response.json()) as T;

    await store.put(apiPath, data);

    return data;
  };

export interface HakushinWeapon {
  icon: string;
  rank: number;
  type: number;
  en: string;
  desc: string;
}

export type HakushinWeaponData = Record<string, HakushinWeapon>;

export interface HakushinEcho {
  icon: string;
  code: string;
  rank: Array<number>;
  group: Array<number>;
  en: string;
  intensity: number;
}

export type HakushinEchoData = Record<string, HakushinEcho>;

export const fetchCharacters = () =>
  fetchDataPath<HakushinCharacterData>(fsStore, 'character.json')();

export const fetchCharacterDetail = (id: number) =>
  fetchDataPath<HakushinCharacterDetail>(fsStore, 'en/character/{0}.json')(id);

export const fetchWeapons = () =>
  fetchDataPath<HakushinWeaponData>(fsStore, 'weapon.json')();

export const fetchEchoes = () =>
  fetchDataPath<HakushinEchoData>(fsStore, 'echo.json')();
