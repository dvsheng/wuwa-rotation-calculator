import { useSuspenseQuery } from '@tanstack/react-query';

import { listEntityMontages } from '@/services/game-data-v2/montages';
import type { Montage } from '@/services/game-data-v2/montages';

export type DedupedMontage = Montage & {
  dedupedNames: Array<string>;
};

export const useEntityMontages = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-montages', id],
    queryFn: () => listEntityMontages({ data: { id } }),
    // select: dedupeMontages,
    staleTime: Infinity,
  });
};

export const dedupeMontages = (montages: Array<Montage>): Array<DedupedMontage> => {
  const montagesByDedupeKey = Map.groupBy(montages, createMontageDedupeKey);

  return [...montagesByDedupeKey.values()]
    .flatMap((duplicates) => clusterMontagesByBulletTimeTolerance(duplicates))
    .map((duplicates) => {
      const dedupedNames = [
        ...new Set(
          duplicates
            .map((montage) => montage.name)
            .toSorted(
              (left, right) => left.length - right.length || left.localeCompare(right),
            ),
        ),
      ];
      const [shortestNamedMontage] = duplicates.toSorted(
        (left, right) =>
          left.name.length - right.name.length || left.name.localeCompare(right.name),
      );

      return {
        ...shortestNamedMontage,
        dedupedNames,
      };
    })
    .toSorted((left, right) => left.name.localeCompare(right.name));
};

const createMontageDedupeKey = (montage: Montage): string => {
  const dedupeFields = Object.fromEntries(
    Object.entries(montage)
      .filter(([key]) => !IGNORED_MONTAGE_DEDUPE_KEYS.has(key))
      .map(([key, value]) => [
        key,
        key === 'notifications'
          ? createNotificationDedupeFields(value as Montage['notifications'])
          : value,
      ]),
  );

  return JSON.stringify(dedupeFields);
};

const createNotificationDedupeFields = (notifications: Montage['notifications']) => {
  return notifications.map((notification) =>
    Object.fromEntries(
      Object.entries(notification).filter(
        ([key]) => !IGNORED_NOTIFICATION_DEDUPE_KEYS.has(key),
      ),
    ),
  );
};

const clusterMontagesByBulletTimeTolerance = (
  montages: Array<Montage>,
): Array<Array<Montage>> => {
  return montages.reduce<Array<Array<Montage>>>((clusters, montage) => {
    const matchingCluster = clusters.find((cluster) =>
      cluster.every((clusterMontage) =>
        areBulletTimesWithinTolerance(clusterMontage, montage),
      ),
    );

    if (matchingCluster) {
      matchingCluster.push(montage);
      return clusters;
    }

    return [...clusters, [montage]];
  }, []);
};

const areBulletTimesWithinTolerance = (left: Montage, right: Montage): boolean => {
  if (left.notifications.length !== right.notifications.length) return false;
  if (!isOptionalWithinTolerance(left.effectiveTime, right.effectiveTime)) {
    return false;
  }
  if (!isOptionalWithinTolerance(left.endTime, right.endTime)) return false;

  return left.notifications.every((notification, index) => {
    const comparisonNotification = right.notifications[index];
    return isWithinTolerance(notification.time, comparisonNotification.time);
  });
};

const isOptionalWithinTolerance = (
  left: number | undefined,
  right: number | undefined,
): boolean => {
  if (left === undefined || right === undefined) return left === right;
  return isWithinTolerance(left, right);
};

const isWithinTolerance = (left: number, right: number): boolean => {
  if (left === right) return true;
  const nonZeroTimes = [Math.abs(left), Math.abs(right)].filter((value) => value > 0);
  if (nonZeroTimes.length !== 2) return false;

  const tolerance = Math.min(...nonZeroTimes) * MONTAGE_TIME_TOLERANCE;
  return Math.abs(left - right) <= tolerance + Number.EPSILON;
};

const MONTAGE_TIME_TOLERANCE = 0.1;
const IGNORED_MONTAGE_DEDUPE_KEYS = new Set([
  'dedupedNames',
  'effectiveTime',
  'endTime',
  'id',
  'name',
  'raw',
]);
const IGNORED_NOTIFICATION_DEDUPE_KEYS = new Set(['time']);
