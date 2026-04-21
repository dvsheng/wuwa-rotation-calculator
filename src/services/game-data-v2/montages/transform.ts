import type {
  ReSkillEventDetails,
  SendGamePlayEventDetails,
  SkillBehaviorDetails,
  StateAddTagDetails,
} from '@/db/raw-schema';

import type { MontageAsset } from '../repostiory';

import { NotificationType } from './types';
import type { MontageData, Notification } from './types';

const RELEVANT_NOTIFICATION_NAMES = new Set([
  'TsAnimNotifySkillBehavior',
  'TsAnimNotifyReSkillEvent',
  'TsAnimNotifyStateAddTag',
  'TsAnimNotifySendGamePlayEvent',
]);

const TIME_STOP_REQUEST_NOTIFICATION_NAME = 'TsAnimNotifyStateTimeStopRequest';

export function toMontage(rawMontage: MontageAsset): MontageData {
  const data = rawMontage.data;

  const notifyDetails = rawMontage.notifyDetails;
  const notificationDetailsByName = new Map(
    notifyDetails.map((notify) => [normalizeNotificationName(notify.Name), notify]),
  );

  const rawNotifications = (data.Properties.Notifies ?? []).map((notification) => ({
    ...notification,
    name: normalizeNotificationName(notification.NotifyName),
  }));
  const notifications: Array<Notification> = rawNotifications
    .filter((notification) => RELEVANT_NOTIFICATION_NAMES.has(notification.name))
    .flatMap((notification): Array<Notification> => {
      const time = notification.LinkValue;
      const detailKey = getDetailKey(notification.Notify?.ObjectName);
      const notificationDetails = notificationDetailsByName.get(detailKey);
      switch (notification.name) {
        case 'TsAnimNotifySkillBehavior': {
          if (!isSkillBehaviorDetails(notificationDetails)) return [];
          return [
            {
              type: NotificationType.SPAWN_BULLETS,
              time,
              bullets: (notificationDetails.Properties?.技能行为 ?? []).flatMap(
                (behavior) => {
                  const bulletIds = behavior.SkillBehaviorActionGroup.flatMap(
                    (actionGroup) =>
                      (actionGroup.Bullets ?? []).map((bullet) =>
                        Number.parseInt(bullet.bulletRowName),
                      ),
                  );
                  const requiredTags = behavior.SkillBehaviorConditionGroup.flatMap(
                    (conditionGroup) =>
                      conditionGroup.TagToCheck.map((tag) =>
                        typeof tag === 'string' ? tag : tag.TagName,
                      ),
                  );
                  return bulletIds.map((bulletId) => ({
                    id: bulletId,
                    condition: {
                      requiredTags,
                    },
                  }));
                },
              ),
            },
          ];
        }
        case 'TsAnimNotifyReSkillEvent': {
          if (!isReSkillEventDetails(notificationDetails)) return [];
          return [
            {
              type: NotificationType.SPAWN_BULLETS,
              time,
              bullets: getBulletIds(notificationDetails.Properties).map((bulletId) => {
                return { id: Number.parseInt(bulletId) };
              }),
            },
          ];
        }
        case 'TsAnimNotifyStateAddTag': {
          if (!isStateAddTagDetails(notificationDetails)) return [];
          const tag = notificationDetails.Properties?.Tag?.TagName;
          const duration = notificationDetails.Properties?.CurrentTimeLength;
          if (!tag || !duration) return [];
          return [{ type: NotificationType.ADD_TAG, time, name: tag, duration }];
        }
        case 'TsAnimNotifySendGamePlayEvent': {
          if (!isSendGamePlayEventDetails(notificationDetails)) return [];
          const name = notificationDetails.Properties?.事件Tag?.TagName;
          if (!name) return [];
          return [{ type: NotificationType.SEND_EVENT, time, name }];
        }
      }
      return [];
    });
  const endTime = rawNotifications.find(
    (notification) => notification.name === 'TsAnimNotifyEndSkill',
  )?.LinkValue;

  const stoppedTime = rawNotifications
    .filter((notification) => notification.name === TIME_STOP_REQUEST_NOTIFICATION_NAME)
    .reduce((total, notification) => {
      const detailKey = getDetailKey(notification.NotifyStateClass?.ObjectName);
      const notificationDetails = notificationDetailsByName.get(detailKey);
      const currentTimeLength = getNumber(
        notificationDetails?.Properties?.CurrentTimeLength,
      );
      return total + (currentTimeLength ?? notification.Duration);
    }, 0);

  const effectiveTime =
    endTime === undefined ? undefined : Math.max(endTime - stoppedTime, 0);
  return {
    name: rawMontage.name.replace('AM_', ''),
    characterName: rawMontage.characterName,
    notifications: notifications,
    effectiveTime,
    endTime,
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

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
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

const getDetailKey = (name: string | undefined): string => {
  if (!name) return '';
  return normalizeNotificationName(name.split(':').at(-1)?.replace("'", '') ?? '');
};

const normalizeNotificationName = (name: string): string => {
  return name.replace('_C', '');
};
