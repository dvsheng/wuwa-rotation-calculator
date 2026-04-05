import { compact, uniq } from 'es-toolkit';

import { EntityType } from '@/services/game-data/types';

import { getBuffsByPrefix, getConnectedBuffs } from '../get-capabilities';
import {
  echoSetEffects,
  echoSets,
  echoes,
  buffs as repositoryBuffs,
  resonatorChains,
  weaponEffects,
  weapons,
} from '../repostiory';
import type { Buff as RepositoryBuff } from '../repostiory';

import { classifyBuffCapability, removeBuffsFromAlternativeGameModes } from './filter';
import { inferBuffSequences } from './infer-buff-sequence';
import { getBuffDuration, getBuffStat, getBuffTarget } from './transform';
import type { Buff } from './types';

export const getEntityBuffsHandler = async (
  id: number,
  entityType: EntityType,
): Promise<Array<Buff>> => {
  const buffIdPrefixes = await getEntityBuffPrefixes(id, entityType);
  const rootBuffsByPrefix = await Promise.all(
    buffIdPrefixes.map(async (prefix) => {
      // GameplayCueId to get outro buffs
      const gameplayCueBuffs = await getBuffsWithGameplayCuePrefix(prefix);
      return [...getBuffsByPrefix(prefix), ...gameplayCueBuffs];
    }),
  );
  const resolvedBuffs = await removeBuffsFromAlternativeGameModes(
    uniq(rootBuffsByPrefix.flat().flatMap((buff) => getConnectedBuffs(buff.id))),
  );

  const sequenceInfoMap = new Map<
    number,
    { unlockedAt?: Buff['unlockedAt']; disabledAt?: Buff['disabledAt'] }
  >();
  if (entityType === EntityType.CHARACTER) {
    const allChains = await resonatorChains.list();
    const entityChains = allChains.filter((chain) => chain.groupId === id);
    for (const buff of inferBuffSequences(resolvedBuffs, entityChains)) {
      if (buff.unlockedAt ?? buff.disabledAt) {
        sequenceInfoMap.set(buff.id, {
          unlockedAt: buff.unlockedAt,
          disabledAt: buff.disabledAt,
        });
      }
    }
  }

  return compact(
    resolvedBuffs.map((buff) => {
      const classification = classifyBuffCapability(buff);
      if (!classification) return;
      const stat = getBuffStat(buff);
      if (!stat) return;

      return {
        buffId: buff.id,
        rawData: buff,
        type: classification,
        duration: getBuffDuration([buff]),
        target: getBuffTarget(stat, [buff]),
        ...stat,
        ...sequenceInfoMap.get(buff.id),
      };
    }),
  );
};

const getBuffsWithGameplayCuePrefix = async (
  prefix: string,
): Promise<Array<RepositoryBuff>> => {
  const allBuffs = await repositoryBuffs.list();
  return allBuffs.filter((buff) =>
    buff.gameplayCueIds.some((gameplayCueId) =>
      String(gameplayCueId).startsWith(prefix),
    ),
  );
};

const getEntityBuffPrefixes = async (
  id: number,
  entityType: EntityType,
): Promise<Array<string>> => {
  switch (entityType) {
    case EntityType.CHARACTER: {
      return [String(id)];
    }
    case EntityType.ECHO: {
      const echo = await echoes.get(id);
      if (!echo) throw new Error('invalid id');
      return [String(echo.skillId).slice(0, 6)];
    }
    case EntityType.WEAPON: {
      const weapon = await weapons.get(id);
      if (!weapon) throw new Error('invalid id');

      const weaponResonRows = await weaponEffects.list();
      const resonanceEffects = weaponResonRows.filter(
        (effect) => effect.resonId === weapon.resonId,
      );
      if (resonanceEffects.length === 0) return [];

      return resonanceEffects[0].effect.map((skillId) => String(skillId).slice(0, 6));
    }
    case EntityType.ECHO_SET: {
      const echoSet = await echoSets.get(id);
      if (!echoSet) throw new Error('invalid id');

      const allEchoSetEffects = await echoSetEffects.list();
      const matchingEffects = allEchoSetEffects.filter(
        (buff) => buff.name === echoSet.fetterGroupName,
      );
      if (matchingEffects.length === 0) return [];

      return matchingEffects
        .at(-1)!
        .buffIds.map((buffId) => String(buffId).slice(0, -1));
    }
  }
};
