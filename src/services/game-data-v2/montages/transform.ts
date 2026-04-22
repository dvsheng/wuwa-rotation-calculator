import type {
  AddBuffDetails,
  ReSkillEventDetails,
  SendGamePlayEventDetails,
  SkillBehaviorDetails,
  StateAddBuffDetails,
  StateAddTagDetails,
} from '@/db/raw-schema';

import type { MontageAsset } from '../repostiory';

import { NOTIFICATION_NAME } from './constants';
import { NotificationType } from './types';
import type { Condition, MontageData, Notification } from './types';

const RELEVANT_NOTIFICATION_NAMES = new Set([
  NOTIFICATION_NAME.SKILL_BEHAVIOR,
  NOTIFICATION_NAME.RE_SKILL_EVENT,
  NOTIFICATION_NAME.STATE_ADD_TAG,
  NOTIFICATION_NAME.SEND_GAME_PLAY_EVENT,
  NOTIFICATION_NAME.ADD_BUFF,
  NOTIFICATION_NAME.STATE_ADD_BUFF,
]);

export const toMontage = (rawMontage: MontageAsset): MontageData => {
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
    .filter((notification) => RELEVANT_NOTIFICATION_NAMES.has(notification.name as any))
    .flatMap((notification): Array<Notification> => {
      const time = notification.LinkValue;
      switch (notification.name) {
        case NOTIFICATION_NAME.SKILL_BEHAVIOR: {
          const detailKey = getDetailKey(notification.Notify?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformSkillBehavior(time, notificationDetails);
        }
        case NOTIFICATION_NAME.RE_SKILL_EVENT: {
          const detailKey = getDetailKey(notification.Notify?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformReSkillEvent(time, notificationDetails);
        }
        case NOTIFICATION_NAME.STATE_ADD_TAG: {
          const detailKey = getDetailKey(notification.NotifyStateClass?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformStateAddTag(time, notificationDetails);
        }
        case NOTIFICATION_NAME.SEND_GAME_PLAY_EVENT: {
          const detailKey = getDetailKey(notification.Notify?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformSendGamePlayEvent(time, notificationDetails);
        }
        case NOTIFICATION_NAME.ADD_BUFF: {
          const detailKey = getDetailKey(notification.Notify?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformAddBuff(time, notificationDetails);
        }
        case NOTIFICATION_NAME.STATE_ADD_BUFF: {
          const detailKey = getDetailKey(notification.NotifyStateClass?.ObjectName);
          const notificationDetails = notificationDetailsByName.get(detailKey);
          return transformStateAddBuff(time, notificationDetails);
        }
      }
      return [];
    });
  const endTime = rawNotifications.find(
    (notification) => notification.name === NOTIFICATION_NAME.END_SKILL,
  )?.LinkValue;

  const absoluteTimeStops = rawNotifications.filter(
    (n) => n.name === NOTIFICATION_NAME.ABSOLUTE_TIME_STOP,
  );

  const stoppedTime = rawNotifications
    .filter((notification) => notification.name === NOTIFICATION_NAME.TIME_STOP_REQUEST)
    .filter(
      (notification) =>
        !absoluteTimeStops.some(
          (abs) =>
            abs.LinkValue === notification.LinkValue &&
            abs.Duration === notification.Duration,
        ),
    )
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
};

const transformSkillBehavior = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isSkillBehaviorDetails(notificationDetails)) return [];
  const allOptions = (notificationDetails.Properties?.技能行为 ?? []).map(
    (behavior) => {
      const bullets = behavior.SkillBehaviorActionGroup.flatMap((actionGroup) =>
        (actionGroup.Bullets ?? []).map((bullet) =>
          Number.parseInt(bullet.bulletRowName),
        ),
      );
      const buffs = behavior.SkillBehaviorActionGroup.flatMap((actionGroup) => {
        const buffId = actionGroup.BuffId;
        return buffId ? [buffId] : [];
      });
      const tags = behavior.SkillBehaviorActionGroup.flatMap((actionGroup) => {
        const tagName = actionGroup.Tag?.TagName;
        return tagName && tagName !== 'None' ? [tagName] : [];
      });
      const requiredTags = behavior.SkillBehaviorConditionGroup.flatMap(
        (conditionGroup) =>
          conditionGroup.TagToCheck.map((tag) =>
            typeof tag === 'string' ? tag : tag.TagName,
          ),
      );
      const isNegated = behavior.SkillBehaviorConditionGroup.some((cg) => cg.Reverse);
      const condition: Condition = {
        requiredTags,
        ...(isNegated && { operator: 'NOT' as const }),
      };
      return { bullets, buffs, tags, condition };
    },
  );
  // Dedupe because in addition to just tags, montages will sometimes choose different bullets
  // based on the distance or height of the character. However, the bullets chosen by these
  // paths can be assumed to be identical, and not needed to be modeled.
  const seenTagKeys = new Set<string>();
  const options = allOptions.filter((option) => {
    const tagKey = `${option.condition.operator ?? ''}:${option.condition.requiredTags.toSorted().join('\0')}`;
    if (seenTagKeys.has(tagKey)) return false;
    seenTagKeys.add(tagKey);
    return true;
  });
  if (options.length === 1) {
    const { bullets, buffs, tags } = options[0];
    const notifications: Array<Notification> = [];
    if (bullets.length > 0)
      notifications.push({ type: NotificationType.SPAWN_BULLETS, time, bullets });
    for (const buffId of buffs)
      notifications.push({ type: NotificationType.APPLY_BUFF, time, buffs: [buffId] });
    for (const tag of tags)
      notifications.push({ type: NotificationType.ADD_TAG, time, name: tag });
    return notifications;
  }
  return [{ type: NotificationType.DYNAMIC_BEHAVIOR, time, options }];
};

const transformReSkillEvent = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isReSkillEventDetails(notificationDetails)) return [];
  return [
    {
      type: NotificationType.SPAWN_BULLETS,
      time,
      bullets: getBulletIds(notificationDetails.Properties).map((id) =>
        Number.parseInt(id),
      ),
    },
  ];
};

const transformStateAddTag = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isStateAddTagDetails(notificationDetails)) return [];
  const tag = notificationDetails.Properties?.Tag?.TagName;
  const duration = notificationDetails.Properties?.CurrentTimeLength;
  if (!tag || !duration) return [];
  return [{ type: NotificationType.ADD_TAG, time, name: tag, duration }];
};

const transformSendGamePlayEvent = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isSendGamePlayEventDetails(notificationDetails)) return [];
  const name = notificationDetails.Properties?.事件Tag?.TagName;
  if (!name) return [];
  return [{ type: NotificationType.SEND_EVENT, time, name }];
};

const transformAddBuff = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isAddBuffDetails(notificationDetails)) return [];
  const buffId = notificationDetails.Properties?.BuffId;
  if (!buffId) return [];
  return [{ type: NotificationType.APPLY_BUFF, time, buffs: [buffId] }];
};

const transformStateAddBuff = (
  time: number,
  notificationDetails: { Type: string } | undefined,
): Array<Notification> => {
  if (!isStateAddBuffDetails(notificationDetails)) return [];
  const buffId = notificationDetails.Properties?.BuffId;
  if (!buffId) return [];
  const duration = notificationDetails.Properties?.CurrentTimeLength;
  return [{ type: NotificationType.APPLY_BUFF, time, buffs: [buffId], duration }];
};

const isReSkillEventDetails = (
  detail: { Type: string } | undefined,
): detail is ReSkillEventDetails => detail?.Type === 'TsAnimNotifyReSkillEvent_C';

const isStateAddTagDetails = (
  detail: { Type: string } | undefined,
): detail is StateAddTagDetails => detail?.Type === 'TsAnimNotifyStateAddTag_C';

const isSendGamePlayEventDetails = (
  detail: { Type: string } | undefined,
): detail is SendGamePlayEventDetails =>
  detail?.Type === 'TsAnimNotifySendGamePlayEvent_C';

const isSkillBehaviorDetails = (
  detail: { Type: string } | undefined,
): detail is SkillBehaviorDetails => detail?.Type === 'TsAnimNotifySkillBehavior_C';

const isAddBuffDetails = (
  detail: { Type: string } | undefined,
): detail is AddBuffDetails => detail?.Type === 'TsAnimNotifyAddBuff_C';

const isStateAddBuffDetails = (
  detail: { Type: string } | undefined,
): detail is StateAddBuffDetails => detail?.Type === 'TsAnimNotifyStateAddBuff_C';

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const getNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

const toBulletId = (value: unknown): string | undefined =>
  typeof value === 'number' ? String(value) : getString(value);

const getBulletIds = (properties: ReSkillEventDetails['Properties']): Array<string> => {
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
};

const getDetailKey = (name: string | undefined): string => {
  if (!name) return '';
  return normalizeNotificationName(name.split(':').at(-1)?.replace("'", '') ?? '');
};

const normalizeNotificationName = (name: string): string => {
  return name.replace(/_C(?=_\d+$)|_C$/, '');
};
