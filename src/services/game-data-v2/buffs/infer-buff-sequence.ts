import { compact, keyBy } from 'es-toolkit';

import type { Sequence } from '@/services/game-data/types';
import { Sequence as SequenceEnum } from '@/services/game-data/types';

import { getConnectedBuffs } from '../get-capabilities';
import type { Buff, ResonatorChain } from '../repostiory';

const SEQUENCE_ORDER = [
  SequenceEnum.S1,
  SequenceEnum.S2,
  SequenceEnum.S3,
  SequenceEnum.S4,
  SequenceEnum.S5,
  SequenceEnum.S6,
] as const satisfies ReadonlyArray<Sequence>;

export type BuffWithSequence = Buff & { unlockedAt?: Sequence; disabledAt?: Sequence };

export const inferBuffSequences = (
  buffs: Array<Buff>,
  chains: Array<ResonatorChain>,
): Array<BuffWithSequence> => {
  const buffMap = keyBy(buffs, (buff) => buff.id) as Partial<Record<number, Buff>>;
  const tagToSeqeuenceMap = new Map<string, Sequence>();
  const buffIdToSequenceMap = new Map<number, Sequence>();

  for (const chain of chains) {
    const sequence = mapChainToSequence(chain);
    if (!sequence) continue;

    for (const buffId of chain.buffIds ?? []) {
      const buff = buffMap[buffId];
      if (!buff) continue;
      const connectedBuffs = getConnectedBuffs(buff.id);
      for (const connectedBuff of connectedBuffs) {
        buffIdToSequenceMap.set(connectedBuff.id, sequence);
      }
      for (const tag of buff.grantedTags) {
        tagToSeqeuenceMap.set(tag, sequence);
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
    // Assume each buff/tag resolves from a single chain path, so we don't need to
    // reconcile competing sequence sources here.
    const unlockedAt =
      compact(unlockTags.map((tag) => tagToSeqeuenceMap.get(tag))).at(0) ??
      buffIdToSequenceMap.get(buff.id);
    const disabledAt = compact(removeTags.map((tag) => tagToSeqeuenceMap.get(tag))).at(
      0,
    );
    return {
      ...buff,
      ...(unlockedAt ? { unlockedAt } : {}),
      ...(disabledAt ? { disabledAt } : {}),
    };
  });
};

function mapChainToSequence(chain: ResonatorChain): Sequence | undefined {
  return SEQUENCE_ORDER[chain.groupIndex - 1];
}
