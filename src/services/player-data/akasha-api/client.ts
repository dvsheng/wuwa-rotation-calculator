import type { DataStore } from '@/services/game-data/hakushin-api/fs-store';
import { createFsStore } from '@/services/game-data/hakushin-api/fs-store';

const AKASHA_API_BASE = 'https://akasha.cv/api';
// Use a separate data directory for player data
const DEFAULT_LOCAL_DATA_PATH =
  typeof window === 'undefined'
    ? `${process.cwd()}/src/services/player-data/akasha-api/data`
    : '';

export const fsStore = createFsStore<any>(DEFAULT_LOCAL_DATA_PATH);

export interface AkashaStatValue {
  value: number;
}

export interface AkashaArtifactSet {
  icon: string;
  count: number;
}

export interface AkashaWeapon {
  weaponId: number;
  weaponInfo: {
    level: number;
    promoteLevel: number;
    refinementLevel: {
      value: number;
    };
  };
  name: string;
  icon: string;
}

export interface AkashaBuild {
  _id: string;
  md5: string;
  characterId: number;
  uid: string;
  name: string;
  critValue: number;
  owner?: {
    nickname: string;
    adventureRank: number;
    region: string;
  };
  artifactSets: Record<string, AkashaArtifactSet>;
  weapon: AkashaWeapon;
  stats: {
    critRate: AkashaStatValue;
    critDamage: AkashaStatValue;
    energyRecharge: AkashaStatValue;
    healingBonus: AkashaStatValue;
    incomingHealingBonus: AkashaStatValue;
    elementalMastery: AkashaStatValue;
    physicalDamageBonus: AkashaStatValue;
    geoDamageBonus: AkashaStatValue;
    cryoDamageBonus: AkashaStatValue;
    pyroDamageBonus: AkashaStatValue;
    anemoDamageBonus: AkashaStatValue;
    hydroDamageBonus: AkashaStatValue;
    dendroDamageBonus: AkashaStatValue;
    electroDamageBonus: AkashaStatValue;
    maxHp: AkashaStatValue;
    atk: AkashaStatValue;
    def: AkashaStatValue;
  };
  constellation: number;
}

export interface AkashaBuildsResponse {
  data: Array<AkashaBuild>;
  totalRowsHash: string;
}

// Adapted fetchDataPath for Akasha API which uses query parameters
export const fetchAkashaDataPath =
  <T>(store: DataStore<T>) =>
  async (endpoint: string, params: Record<string, string | number>): Promise<T> => {
    // Create a deterministic cache key based on endpoint and sorted params
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    // Create a safe filename from the cache key
    const cacheKey = `${endpoint.replace(/\//g, '_')}_${sortedParams.replace(/[^a-z0-9]/gi, '_')}.json`;

    const cachedData = await store.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    console.log(`Store miss for ${cacheKey}, fetching from API...`);

    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();

    const url = `${AKASHA_API_BASE}/${endpoint}?${queryString}`;

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Only set User-Agent and Referer/Origin on the server to avoid browser security restrictions
    if (typeof window === 'undefined') {
      headers['User-Agent'] =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      headers['Referer'] = 'https://akasha.cv/';
      headers['Origin'] = 'https://akasha.cv';
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const data = (await response.json()) as T;

    await store.put(cacheKey, data);

    return data;
  };

export const fetchCharacterBuilds = (characterName: string, page: number = 1) => {
  return fetchAkashaDataPath<AkashaBuildsResponse>(fsStore)('builds/', {
    sort: 'critValue',
    order: -1,
    size: 20,
    page,
    filter: `[name]${characterName}`,
  });
};

export const fetchPlayerBuilds = (uid: string) =>
  fetchAkashaDataPath<AkashaBuildsResponse>(fsStore)('builds/', {
    sort: 'critValue',
    order: -1,
    size: 20,
    page: 1,
    uid,
  });

export interface AkashaArtifact {
  _id: string;
  uid: string;
  critValue: number;
  equipType: string;
  icon: string;
  level: number;
  mainStatKey: string;
  mainStatValue: number;
  name: string;
  setName: string;
  stars: number;
  substats: Record<string, number>;
}

export interface AkashaArtifactsResponse {
  data: Array<AkashaArtifact>;
  ttl: number;
}

export const fetchPlayerArtifacts = (uid: string, md5: string) =>
  fetchAkashaDataPath<AkashaArtifactsResponse>(fsStore)(`artifacts/${uid}/${md5}`, {});
