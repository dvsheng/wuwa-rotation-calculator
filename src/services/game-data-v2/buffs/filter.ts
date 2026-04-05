import { CapabilityType } from '@/services/game-data/types';

import {
  rogueCharacterBuffs,
  roguePermanentBuffPools,
  roguePermanentCharacterBuffs,
  rogueWeeklyBuffPools,
} from '../repostiory';
import type { Buff, Buff as RepositoryBuff } from '../repostiory';

import { ExtraEffectRequirement } from './constants';

const ALT_GAMEMODE_TAG = ['肉鸽', 'Rogue', '装備', '関卡'];

const ALT_GAMEMODE_BUFF_PREFIX = '99';

export function isBuffScopedToSpecificAttacks(b: RepositoryBuff) {
  return b.extraEffectRequirements.includes(ExtraEffectRequirement.OnDamageInstances);
}

export function isAlwaysActiveBuff(buff: RepositoryBuff) {
  return (
    (buff.durationMagnitude.length === 0 || buff.durationMagnitude[0] > 60) &&
    buff.extraEffectRequirements.filter(
      (requirement) =>
        requirement !== ExtraEffectRequirement.OnAttribute &&
        requirement !== ExtraEffectRequirement.OnDamageType &&
        requirement !== ExtraEffectRequirement.OnSkillTreeUnlock &&
        requirement !== ExtraEffectRequirement.OnDamageInstances,
    ).length > 1
  );
}

export function classifyBuffCapability(buff: RepositoryBuff) {
  if (isAlwaysActiveBuff(buff)) {
    return CapabilityType.PERMANENT_STAT;
  }
  return CapabilityType.MODIFIER;
}

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
