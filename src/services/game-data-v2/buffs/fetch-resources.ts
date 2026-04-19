import { uniq } from 'es-toolkit';

import { EntityType } from '@/services/game-data/types';

import { getBuffsByPrefix, getConnectedBuffs } from '../get-capabilities';
import {
  echoSetEffects,
  echoSets,
  echoes,
  buffs as repositoryBuffs,
  weaponEffects,
  weapons,
} from '../repostiory';
import type { Buff as RepositoryBuff } from '../repostiory';

import { removeBuffsFromAlternativeGameModes } from './filter';

export async function fetchResourcesForEntity(
  id: number,
  entityType: EntityType,
): Promise<Array<RepositoryBuff>> {
  const buffIdPrefixes = await getEntityBuffPrefixes(id, entityType);
  const rootBuffsByPrefix = await Promise.all(
    buffIdPrefixes.map(async (prefix) => {
      const gameplayCueBuffs = await getBuffsWithGameplayCuePrefix(prefix);
      return [...getBuffsByPrefix(prefix), ...gameplayCueBuffs];
    }),
  );

  return removeBuffsFromAlternativeGameModes(
    uniq(rootBuffsByPrefix.flat().flatMap((buff) => getConnectedBuffs(buff.id))),
  );
}

export async function getEntityBuffPrefixes(
  id: number,
  entityType: EntityType,
): Promise<Array<string>> {
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
}

export async function getBuffsWithGameplayCuePrefix(
  prefix: string,
): Promise<Array<RepositoryBuff>> {
  const allBuffs = await repositoryBuffs.list();
  return allBuffs.filter((buff) =>
    buff.gameplayCueIds.some((gameplayCueId) =>
      String(gameplayCueId).startsWith(prefix),
    ),
  );
}
