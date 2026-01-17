import echoSets from '@/services/game-data/data/echo-set.json';

export interface EchoSetResponseItem {
  id: string;
  name: string;
  tiers: Array<number>;
}

export const listEchoSets = (): Array<EchoSetResponseItem> => {
  return Object.entries(echoSets).map(([id, group]) => ({
    id,
    name: group.en,
    tiers: group.tiers,
  }));
};

export const getEchoSetIdByName = (name: string): string | undefined => {
  const entry = Object.entries(echoSets).find(([_id, group]) => group.en === name);
  return entry ? entry[0] : undefined;
};
