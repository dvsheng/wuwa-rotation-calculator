import { database } from '@/db/client';
import {
  rawBaseProperties,
  rawBuffs,
  rawChains,
  rawDamage,
  rawMontages,
  rawPhantomFetterGroups,
  rawPhantomFetters,
  rawPhantomItems,
  rawPhantomSkills,
  rawReBulletDataMainRows,
  rawRogueCharacterBuffs,
  rawRoguePermanentBuffPools,
  rawRoguePermanentCharacterBuffs,
  rawRogueWeeklyBuffPools,
  rawRoleInfo,
  rawRolePropertyGrowth,
  rawSkillAttributes,
  rawSkillDescriptions,
  rawSkillInfoRows,
  rawSkillTreeNodes,
  rawSkills,
  rawWeaponConfig,
  rawWeaponGrowth,
  rawWeaponReson,
} from '@/db/raw-schema';
import type {
  RawBaseProperty,
  RawBuff,
  RawChain,
  RawDamage,
  RawMontage,
  RawPhantomFetter,
  RawPhantomFetterGroup,
  RawPhantomItem,
  RawPhantomSkill,
  RawReBulletDataMainRow,
  RawRogueCharacterBuff,
  RawRoguePermanentBuffPool,
  RawRoguePermanentCharacterBuff,
  RawRogueWeeklyBuffPool,
  RawRoleInfo,
  RawRolePropertyGrowth,
  RawSkill,
  RawSkillAttribute,
  RawSkillDescription,
  RawSkillInfoRow,
  RawSkillTreeNode,
  RawWeaponConfig,
  RawWeaponGrowth,
  RawWeaponReson,
} from '@/db/raw-schema';

type ScalarKey = string | number;

export type Buff = RawBuff;
export type ResonatorChain = RawChain;
export type RogueCharacterBuff = RawRogueCharacterBuff;
export type RoguePermanentCharacterBuff = RawRoguePermanentCharacterBuff;
export type RoguePermanentBuffPool = RawRoguePermanentBuffPool;
export type RogueWeeklyBuffPool = RawRogueWeeklyBuffPool;
export type Damage = RawDamage;
export type EchoSet = RawPhantomFetterGroup;
export type EchoSetEffect = RawPhantomFetter;
export type EchoSkill = RawPhantomSkill;
export type Resonator = RawRoleInfo;
export type ResonatorPropertyGrowth = RawRolePropertyGrowth;
export type ResonatorSkillDescription = RawSkillDescription;
export type SkillAttribute = RawSkillAttribute;
export type ResonatorSkillTreeNode = RawSkillTreeNode;
export type ResonatorSkill = RawSkill;
export type Weapon = RawWeaponConfig;
export type WeaponGrowth = RawWeaponGrowth;
export type WeaponEffect = RawWeaponReson;
export type RawBasePropertyEntry = RawBaseProperty;
export type Echo = RawPhantomItem;
export type MontageAsset = RawMontage;
export type SkillInfoRow = RawSkillInfoRow;
export type ReBulletDataMainRow = RawReBulletDataMainRow;

export type ReadOnlyRepository<TRow, TKey> = {
  list: () => Promise<Array<TRow>>;
  get: (key: TKey) => Promise<TRow | undefined>;
  getByIds: (keys: Array<TKey>) => Promise<Array<TRow>>;
};

function createReadOnlyRepository<TRow, TKey>(
  loadRows: () => Promise<Array<TRow>>,
  getKey: (row: TRow) => TKey,
  serializeKey: (key: TKey) => ScalarKey = (key) => JSON.stringify(key),
): ReadOnlyRepository<TRow, TKey> {
  let cachedRowsPromise: Promise<Array<TRow>> | undefined;
  let cachedRowMapPromise: Promise<Map<ScalarKey, TRow>> | undefined;

  const list = () => {
    cachedRowsPromise ??= loadRows();
    return cachedRowsPromise;
  };

  const get = async (key: TKey) => {
    cachedRowMapPromise ??= list().then(
      (rows) => new Map(rows.map((row) => [serializeKey(getKey(row)), row] as const)),
    );
    const cachedRowMap = await cachedRowMapPromise;
    return cachedRowMap.get(serializeKey(key));
  };

  const getByIds = async (keys: Array<TKey>): Promise<Array<TRow>> => {
    const results = await Promise.all(keys.map((key) => get(key)));
    return results.filter((row) => row !== undefined) as Array<TRow>;
  };

  return { list, get, getByIds };
}

const byId = <T extends { id: number }>(row: T) => row.id;

const byCompositeKey = <TKey>(key: TKey) => JSON.stringify(key);

export const resonatorSkills = createReadOnlyRepository<ResonatorSkill, number>(
  () => database.select().from(rawSkills),
  byId,
  String,
);

export const damage = createReadOnlyRepository<Damage, number>(
  () => database.select().from(rawDamage),
  byId,
  String,
);

export const resonatorSkillDescriptions = createReadOnlyRepository<
  ResonatorSkillDescription,
  number
>(() => database.select().from(rawSkillDescriptions), byId, String);

export const skillAttributes = createReadOnlyRepository<SkillAttribute, number>(
  () => database.select().from(rawSkillAttributes),
  byId,
  String,
);

export const buffs = createReadOnlyRepository<Buff, number>(
  () => database.select().from(rawBuffs),
  byId,
  String,
);

export const resonatorChains = createReadOnlyRepository<ResonatorChain, number>(
  () => database.select().from(rawChains),
  byId,
  String,
);

export const rogueCharacterBuffs = createReadOnlyRepository<RogueCharacterBuff, number>(
  () => database.select().from(rawRogueCharacterBuffs),
  byId,
  String,
);

export const roguePermanentCharacterBuffs = createReadOnlyRepository<
  RoguePermanentCharacterBuff,
  number
>(() => database.select().from(rawRoguePermanentCharacterBuffs), byId, String);

export const roguePermanentBuffPools = createReadOnlyRepository<
  RoguePermanentBuffPool,
  number
>(() => database.select().from(rawRoguePermanentBuffPools), byId, String);

export const rogueWeeklyBuffPools = createReadOnlyRepository<
  RogueWeeklyBuffPool,
  number
>(() => database.select().from(rawRogueWeeklyBuffPools), byId, String);

export const rawBasePropertiesRepository = createReadOnlyRepository<
  RawBasePropertyEntry,
  { id: number; lv: number }
>(
  () => database.select().from(rawBaseProperties),
  (row) => ({ id: row.id, lv: row.lv }),
  byCompositeKey,
);

export const resonatorPropertyGrowth = createReadOnlyRepository<
  ResonatorPropertyGrowth,
  number
>(() => database.select().from(rawRolePropertyGrowth), byId, String);

export const resonatorSkillTreeNodes = createReadOnlyRepository<
  ResonatorSkillTreeNode,
  number
>(() => database.select().from(rawSkillTreeNodes), byId, String);

export const resonators = createReadOnlyRepository<Resonator, number>(
  () => database.select().from(rawRoleInfo),
  byId,
  String,
);

export const weaponGrowth = createReadOnlyRepository<WeaponGrowth, number>(
  () => database.select().from(rawWeaponGrowth),
  byId,
  String,
);

export const weaponEffects = createReadOnlyRepository<WeaponEffect, number>(
  () => database.select().from(rawWeaponReson),
  byId,
  String,
);

export const weapons = createReadOnlyRepository<Weapon, number>(
  () => database.select().from(rawWeaponConfig),
  (row) => row.itemId,
  String,
);

export const echoSets = createReadOnlyRepository<EchoSet, number>(
  () => database.select().from(rawPhantomFetterGroups),
  byId,
  String,
);

export const echoSetEffects = createReadOnlyRepository<EchoSetEffect, number>(
  () => database.select().from(rawPhantomFetters),
  byId,
  String,
);

export const echoes = createReadOnlyRepository<Echo, number>(
  () => database.select().from(rawPhantomItems),
  (row) => row.itemId,
  String,
);

export const echoSkills = createReadOnlyRepository<EchoSkill, number>(
  () => database.select().from(rawPhantomSkills),
  (row) => row.phantomSkillId,
  String,
);

export const montageAssets = createReadOnlyRepository<MontageAsset, string>(
  () => database.select().from(rawMontages),
  (row) => `${row.characterName}:${row.name}`,
  String,
);

export const skillInfoRows = createReadOnlyRepository<SkillInfoRow, number>(
  () => database.select().from(rawSkillInfoRows),
  (row) => row.skillId,
  String,
);

export const reBulletDataMainRows = createReadOnlyRepository<
  ReBulletDataMainRow,
  string
>(
  () => database.select().from(rawReBulletDataMainRows),
  (row) => String(row.bulletId),
  String,
);
