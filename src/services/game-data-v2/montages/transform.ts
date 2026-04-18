import { isNil } from 'es-toolkit';

import type { MontageAsset } from '../repostiory';

import type { Montage } from './types';

export function toMontage(rawMontage: MontageAsset): Montage {
  const data = rawMontage.data;

  const notifications = data.Properties.Notifies ?? [];
  const notificationsByType = Object.groupBy(notifications, (notification) =>
    normalizeNotificationName(notification.NotifyName),
  );

  const notifyDetails = rawMontage.notifyDetails;
  const notificationDetailsByName = new Map(
    notifyDetails.map((notify) => [normalizeNotificationName(notify.Name), notify]),
  );

  const bullets =
    notificationsByType['TsAnimNotifyReSkillEvent']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      return getBulletIds(details?.Properties).map((id) => ({ bulletId: id, time }));
    }) ?? [];

  const tags =
    notificationsByType['TsAnimNotifyStateAddTag']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      const tag = details?.Properties?.Tag;
      const duration = details?.Properties?.CurrentTimeLength;
      if (!tag || !duration) return [];
      return [{ time, name: tag as string, duration: duration as number }];
    }) ?? [];

  const events =
    notificationsByType['TsAnimNotifySendGamePlayEvent']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      const eventTag = details?.Properties?.事件Tag;
      const name =
        typeof eventTag === 'object' && !isNil(eventTag) && 'TagName' in eventTag
          ? (eventTag.TagName as string)
          : undefined;
      if (!name) return [];
      return [{ time, name }];
    }) ?? [];

  const cancelTime = notificationsByType['TsAnimNotifyStateNextAtt']?.[0]?.LinkValue;
  const endTime = notificationsByType['TsAnimNotifyEndSkill']?.[0]?.LinkValue;

  return {
    name: rawMontage.name.replace('AM_', ''),
    bullets,
    cancelTime,
    endTime,
    tags,
    events,
  };
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toBulletId(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  return getString(value);
}

function getBulletIds(properties: Record<string, unknown> | undefined): Array<string> {
  const useDamageIdArray = properties?.使用子弹id数组 === true;
  const bulletIdArray = Array.isArray(properties?.子弹id数组)
    ? properties.子弹id数组
        .map((value) => toBulletId(value))
        .filter((value) => value !== undefined)
    : [];

  if (useDamageIdArray && bulletIdArray.length > 0) {
    return bulletIdArray;
  }

  const bulletId = toBulletId(properties?.子弹数据名);
  if (!bulletId || bulletId === 'None') {
    return [];
  }

  return [bulletId];
}

const getDetailReference = (name: string): string => {
  return normalizeNotificationName(name.split(':').at(-1)?.replace("'", '') ?? '');
};

const normalizeNotificationName = (name: string): string => {
  return name.replace('_C', '');
};
