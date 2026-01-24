import echoGroups from '@/services/game-data/data/echo-set.json';

import { fetchEchoes } from '../hakushin-api/client';

export interface ListEchoesResponseItem {
  id: string;
  name: string;
  cost: number;
  sets: Array<string>;
}

export type ListEchoesResponse = Array<ListEchoesResponseItem>;

export const listEchoes = async (): Promise<ListEchoesResponse> => {
  const echoes = await fetchEchoes();
  const groups = echoGroups as Record<string, { en: string; tiers: Array<number> }>;

  return Object.entries(echoes)
    .filter(([_id, echo]) => !echo.en.startsWith('Nightmare:'))
    .map(([id, echo]) => {
      // Map Hakushin intensity to cost: 0 -> 1, 1 -> 3, 2/3 -> 4
      let cost = 1;
      if (echo.intensity === 1) cost = 3;
      else if (echo.intensity === 2 || echo.intensity === 3) cost = 4;

      return {
        id: id,
        name: echo.en,
        cost,
        sets: echo.group.map((gId) => groups[String(gId)].en).filter(Boolean),
      };
    });
};

export const getEchoIdByName = async (name: string): Promise<string | undefined> => {
  const echoes = await fetchEchoes();
  const entry = Object.entries(echoes).find(([_id, echo]) => echo.en === name);
  return entry ? entry[0] : undefined;
};
