import {
  rogueCharacterBuffs,
  roguePermanentBuffPools,
  roguePermanentCharacterBuffs,
  rogueWeeklyBuffPools,
} from '../repostiory';
import type { Buff } from '../repostiory';

const ALT_GAMEMODE_TAG = ['肉鸽', 'Rogue', '装備', '関卡'];

const ALT_GAMEMODE_BUFF_PREFIX = '99';

export const removeBuffsFromAlternativeGameModes = async (
  buffs: Array<Buff>,
): Promise<Array<Buff>> => {
  const rogueBuffIds = await getRogueBuffIds();
  const rogueBuffIdSet = new Set(rogueBuffIds);
  return buffs.filter(
    (buff) => !isFromAlternateGamemode(buff) && !rogueBuffIdSet.has(buff.id),
  );
};

const isFromAlternateGamemode = (buff: Buff) => {
  const fieldsToCheck = ['buffAction', 'applicationTagIgnores'] as const;
  for (const field of fieldsToCheck) {
    if (
      buff[field].some((tag) => ALT_GAMEMODE_TAG.some((badTag) => tag.includes(badTag)))
    )
      return true;
    if (String(buff.id).slice(4, 6) === ALT_GAMEMODE_BUFF_PREFIX) return true;
  }
  return false;
};

const getRogueBuffIds = async (): Promise<Array<number>> => {
  const [
    characterBuffs,
    permanentBuffPools,
    permanentCharacterBuffs,
    weeklyBuffsPools,
  ] = await Promise.all([
    rogueCharacterBuffs.list(),
    roguePermanentBuffPools.list(),
    roguePermanentCharacterBuffs.list(),
    rogueWeeklyBuffPools.list(),
  ]);
  return [
    ...characterBuffs.flatMap((buff) => buff.buffIds),
    ...permanentBuffPools.flatMap((buff) => buff.buffId),
    ...permanentCharacterBuffs.flatMap((buff) => buff.buffIds),
    ...weeklyBuffsPools.flatMap((buff) => buff.buffId),
  ];
};
