import { zip } from 'es-toolkit';

import type { Buff } from '../buffs';
import { ExtraEffectRequirement } from '../buffs/constants';
import { getConnectedBuffs } from '../get-capabilities';

type BuffGrouper = (buffs: Array<Buff>) => Array<Array<Buff>>;

/**
 * Group buffs with a shared connectedBuffs together
 * @param buffs
 */
export const groupBuffsByConnection: BuffGrouper = (buffs) => {
  const connectedBuffIdsById = new Map(
    buffs.map((buff) => [
      buff.raw.id,
      new Set(getConnectedBuffs(buff.raw.id).map((connected) => connected.id)),
    ]),
  );
  return groupBuffs(
    buffs,
    (buff) => connectedBuffIdsById.get(buff.raw.id) ?? new Set<number>(),
    (leftBuff, rightBuff) =>
      !shouldNotGroupBuffs(leftBuff, rightBuff) &&
      (connectedBuffIdsById.get(leftBuff.raw.id)?.has(rightBuff.raw.id) ?? false),
  );
};

/**
 * Group buffs with a shared GrantedTag together
 * @param buffs
 */
export const groupBuffsBySharedTags: BuffGrouper = (buffs) => {
  return groupBuffs(
    buffs,
    (buff) => new Set(buff.raw.grantedTags),
    (leftBuff, rightBuff) =>
      !shouldNotGroupBuffs(leftBuff, rightBuff) &&
      leftBuff.raw.grantedTags.some((tag) => rightBuff.raw.grantedTags.includes(tag)),
  );
};

export const groupBuffsBySharedOriginTypeCast: BuffGrouper = (buffs) => {
  const originTypeCastRequestParametersByBuffId = new Map(
    buffs.map((buff) => [
      buff.raw.id,
      new Set(getConnectedOriginTypeCastRequestParameters(buff)),
    ]),
  );

  return groupBuffs(
    buffs,
    (buff) =>
      originTypeCastRequestParametersByBuffId.get(buff.raw.id) ?? new Set<string>(),
    (leftBuff, rightBuff) =>
      !shouldNotGroupBuffs(leftBuff, rightBuff) &&
      hasIntersection(
        originTypeCastRequestParametersByBuffId.get(leftBuff.raw.id) ??
          new Set<string>(),
        originTypeCastRequestParametersByBuffId.get(rightBuff.raw.id) ??
          new Set<string>(),
      ),
  );
};

// test if two buffs are both referenceed by a common parent through extra effect id
// but the children have different application tags, they are not grouped together

const shouldNotGroupBuffs = (buff1: Buff, buff2: Buff) => {
  return buff1.duration != buff2.duration;
};

const getConnectedOriginTypeCastRequestParameters = (buff: Buff): Array<string> => {
  return getConnectedBuffs(buff.raw.id).flatMap((connectedBuff) =>
    zip(
      connectedBuff.extraEffectRequirements,
      connectedBuff.extraEffectReqPara,
    ).flatMap(([requirement, parameter]) =>
      requirement === ExtraEffectRequirement.OnOriginTypeCast
        ? [String(parameter)]
        : [],
    ),
  );
};

const groupBuffs = (
  buffs: Array<Buff>,
  getKeySet: (buff: Buff) => Set<string | number>,
  shouldGroup: (leftBuff: Buff, rightBuff: Buff) => boolean,
): Array<Array<Buff>> => {
  const groupedBuffs: Array<Array<Buff>> = [];
  const visitedBuffIds = new Set<number>();

  for (const buff of buffs) {
    if (visitedBuffIds.has(buff.buffId)) continue;

    const queue = [buff];
    const group: Array<Buff> = [];

    while (queue.length > 0) {
      const currentBuff = queue.shift()!;
      if (visitedBuffIds.has(currentBuff.buffId)) continue;

      visitedBuffIds.add(currentBuff.buffId);
      group.push(currentBuff);

      const currentKeys = getKeySet(currentBuff);
      for (const candidateBuff of buffs) {
        if (visitedBuffIds.has(candidateBuff.buffId)) continue;

        const candidateKeys = getKeySet(candidateBuff);
        if (
          hasIntersection(currentKeys, candidateKeys) &&
          shouldGroup(currentBuff, candidateBuff)
        ) {
          queue.push(candidateBuff);
        }
      }
    }

    groupedBuffs.push(group);
  }

  return groupedBuffs;
};

const hasIntersection = (
  leftSet: Set<string | number>,
  rightSet: Set<string | number>,
): boolean => {
  for (const value of leftSet) {
    if (rightSet.has(value)) return true;
  }
  return false;
};
