import { compact, keyBy, uniq } from 'es-toolkit';

import type { Sequence } from '@/services/game-data/types';
import { EntityType } from '@/services/game-data/types';

import { getBuffsByPrefix, getConnectedBuffs } from '../get-capabilities';
import { resonatorChains } from '../repostiory';
import type { Buff, ResonatorChain } from '../repostiory';

import { SEQUENCE_ORDER } from './constants';
import { getBuffsWithGameplayCuePrefix, getEntityBuffPrefixes } from './fetch-resources';
import { removeBuffsFromAlternativeGameModes } from './filter';
import type { BuffData } from './types';

export type BuffContext = {
  sequenceInfoByBuffId: Map<number, Pick<BuffData, 'unlockedAt' | 'disabledAt'>>;
};

type BuffWithSequence = Buff & { unlockedAt?: Sequence; disabledAt?: Sequence };

export async function fetchContextForEntity(
  id: number,
  entityType: EntityType,
): Promise<BuffContext> {
  const sequenceInfoByBuffId = new Map<
    number,
    Pick<BuffData, 'unlockedAt' | 'disabledAt'>
  >();

  if (entityType !== EntityType.CHARACTER) {
    return { sequenceInfoByBuffId };
  }

  const buffIdPrefixes = await getEntityBuffPrefixes(id, entityType);
  const rootBuffsByPrefix = await Promise.all(
    buffIdPrefixes.map(async (prefix) => {
      const gameplayCueBuffs = await getBuffsWithGameplayCuePrefix(prefix);
      return [...getBuffsByPrefix(prefix), ...gameplayCueBuffs];
    }),
  );
  const resolvedBuffs = await removeBuffsFromAlternativeGameModes(
    uniq(rootBuffsByPrefix.flat().flatMap((buff) => getConnectedBuffs(buff.id))),
  );
  const allChains = await resonatorChains.list();
  const entityChains = allChains.filter((chain) => chain.groupId === id);

  for (const buff of inferBuffSequences(resolvedBuffs, entityChains)) {
    if (buff.unlockedAt ?? buff.disabledAt) {
      sequenceInfoByBuffId.set(buff.id, {
        unlockedAt: buff.unlockedAt,
        disabledAt: buff.disabledAt,
      });
    }
  }

  return { sequenceInfoByBuffId };
}

function inferBuffSequences(
  buffs: Array<Buff>,
  chains: Array<ResonatorChain>,
): Array<BuffWithSequence> {
  const buffMap = keyBy(buffs, (buff) => buff.id) as Partial<Record<number, Buff>>;
  const tagToSequenceMap = new Map<string, Sequence>();
  const buffIdToSequenceMap = new Map<number, Sequence>();

  for (const chain of chains) {
    const sequence = SEQUENCE_ORDER[chain.groupIndex - 1];
    if (!sequence) continue;

    for (const buffId of chain.buffIds ?? []) {
      const buff = buffMap[buffId];
      if (!buff) continue;
      const connectedBuffs = getConnectedBuffs(buff.id);
      for (const connectedBuff of connectedBuffs) {
        buffIdToSequenceMap.set(connectedBuff.id, sequence);
      }
      for (const tag of buff.grantedTags) {
        tagToSequenceMap.set(tag, sequence);
      }
    }
  }

  return buffs.map((buff) => {
    const unlockTags = [
      ...buff.ongoingTagRequirements,
      ...buff.applicationTagRequirements,
      ...buff.applicationSourceTagRequirements,
    ];
    const removeTags = buff.removalTagRequirements;
    const unlockedAt =
      compact(unlockTags.map((tag) => tagToSequenceMap.get(tag))).at(0) ??
      buffIdToSequenceMap.get(buff.id);
    const disabledAt = compact(removeTags.map((tag) => tagToSequenceMap.get(tag))).at(0);
    return {
      ...buff,
      ...(unlockedAt ? { unlockedAt } : {}),
      ...(disabledAt ? { disabledAt } : {}),
    };
  });
}
