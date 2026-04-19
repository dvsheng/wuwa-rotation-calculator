import type {
  ReSkillEventDetails,
  SendGamePlayEventDetails,
  SkillBehaviorDetails,
  StateAddTagDetails,
} from '@/db/raw-schema';

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

  const bullets = [
    ...(notificationsByType['TsAnimNotifyReSkillEvent']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      if (!isReSkillEventDetails(details)) return [];
      return getBulletIds(details.Properties).map((id) => ({
        bulletId: id,
        time,
      }));
    }) ?? []),
    ...(notificationsByType['TsAnimNotifySkillBehavior']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      if (!isSkillBehaviorDetails(details)) return [];
      return (details.Properties?.技能行为 ?? []).flatMap((behavior) =>
        behavior.SkillBehaviorActionGroup_20_E7E8941646BF84E137B075AD36D96317.flatMap(
          (action) =>
            (action.Bullets_77_D4BBB46C47AE6F88D881F9ADA9156FFA ?? []).map((bullet) => ({
              bulletId: bullet.bulletRowName_15_E1264B954C05799310C2CA8F2AA41295,
              time,
            })),
        ),
      );
    }) ?? []),
  ];

  const tags =
    notificationsByType['TsAnimNotifyStateAddTag']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      if (!isStateAddTagDetails(details)) return [];
      const tag = details.Properties?.Tag?.TagName;
      const duration = details.Properties?.CurrentTimeLength;
      if (!tag || !duration) return [];
      return [{ time, name: tag, duration }];
    }) ?? [];

  const events =
    notificationsByType['TsAnimNotifySendGamePlayEvent']?.flatMap((notify) => {
      const time = notify.LinkValue;
      const detailReference = getDetailReference(notify.Notify?.ObjectName ?? '');
      const details = notificationDetailsByName.get(detailReference);
      if (!isSendGamePlayEventDetails(details)) return [];
      const name = details.Properties?.事件Tag?.TagName;
      if (!name) return [];
      return [{ time, name }];
    }) ?? [];

  const cancelTime = notificationsByType['TsAnimNotifyStateNextAtt']?.[0]?.LinkValue;
  const endTime = notificationsByType['TsAnimNotifyEndSkill']?.[0]?.LinkValue;

  return {
    name: rawMontage.name.replace('AM_', ''),
    id: `${rawMontage.name}-${rawMontage.characterName}`,
    bullets,
    cancelTime,
    endTime,
    tags,
    events,
  };
}

function isReSkillEventDetails(
  detail: { Type: string } | undefined,
): detail is ReSkillEventDetails {
  return detail?.Type === 'TsAnimNotifyReSkillEvent_C';
}

function isStateAddTagDetails(
  detail: { Type: string } | undefined,
): detail is StateAddTagDetails {
  return detail?.Type === 'TsAnimNotifyStateAddTag_C';
}

function isSendGamePlayEventDetails(
  detail: { Type: string } | undefined,
): detail is SendGamePlayEventDetails {
  return detail?.Type === 'TsAnimNotifySendGamePlayEvent_C';
}

function isSkillBehaviorDetails(
  detail: { Type: string } | undefined,
): detail is SkillBehaviorDetails {
  return detail?.Type === 'TsAnimNotifySkillBehavior_C';
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toBulletId(value: unknown): string | undefined {
  return typeof value === 'number' ? String(value) : getString(value);
}

function getBulletIds(properties: ReSkillEventDetails['Properties']): Array<string> {
  const useDamageIdArray = properties?.使用子弹id数组 === true;
  const bulletIdArray = properties?.子弹id数组?.map(String) ?? [];

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
