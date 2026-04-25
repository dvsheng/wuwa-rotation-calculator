import type { DamageType } from '@/types';

import type { Buff } from '../buffs';
import type { Bullet } from '../bullets';
import { transformBulletsToTimedHits } from '../bullets/transform-bullet-to-timed-hits';
import type { DamageInstance } from '../damage-instances';

import { NotificationType } from './types';
import type { Montage } from './types';

export interface TransformMontageToEventGroupsOptions {
  montage: Montage;
  bulletMap: Partial<Record<number, Bullet>>;
  damageMap: Partial<Record<number, DamageInstance>>;
  buffMap: Partial<Record<number, Buff>>;
  onStartBuffs?: Array<number>;
  onEndBuffs?: Array<number>;
}

export type DamageEvent = Omit<DamageInstance, 'alternativeMotionValue' | 'type'> & {
  eventType: 'damage';
  damageType: DamageType;
  time: number;
};

export type BuffEvent = Omit<Buff, 'type'> & { eventType: 'buff'; time: number };

export type Event = BuffEvent | DamageEvent;
type TaggedEvent = Event & {
  requiredTags: Array<string>;
  forbiddenTags: Array<string>;
};

export interface MontageEventGroup {
  requiredTags: Array<string>;
  forbiddenTags: Array<string>;
  events: Array<Event>;
}

export const transformMontageToEventGroups = ({
  montage,
  bulletMap,
  damageMap,
  buffMap,
  onStartBuffs = [],
  onEndBuffs = [],
}: TransformMontageToEventGroupsOptions): Array<MontageEventGroup> => {
  const getBulletById = (id: string): Bullet | undefined => bulletMap[Number(id)];

  const processSpawnEvent = (
    notificationTime: number,
    bulletIds: Array<number>,
    condRequired: Array<string> = [],
    condForbidden: Array<string> = [],
  ): Array<TaggedEvent> => {
    return bulletIds.flatMap((bulletId) => {
      const bullet = bulletMap[bulletId];
      if (!bullet) return [];

      const combinedRequired = [...condRequired, ...bullet.requiredTags];
      const combinedForbidden = [...condForbidden, ...bullet.forbiddenTags];

      return transformBulletsToTimedHits(
        bullet,
        getBulletById,
        notificationTime,
      ).flatMap(({ damageId, time }) => {
        const damageInstance = damageMap[damageId];
        if (!damageInstance) return [];
        return toDamageEventsWithTags(
          damageInstance,
          time,
          combinedRequired,
          combinedForbidden,
        );
      });
    });
  };

  const lastNotificationTime = montage.notifications.reduce(
    (max, n) => Math.max(max, n.time),
    0,
  );
  const endTime = montage.endTime ?? lastNotificationTime;

  const events: Array<TaggedEvent> = montage.notifications.flatMap((notification) => {
    if (notification.type === NotificationType.SPAWN_BULLETS) {
      return processSpawnEvent(notification.time, notification.bullets);
    }

    if (notification.type === NotificationType.DYNAMIC_BEHAVIOR) {
      return notification.options.flatMap((option) => {
        const condRequired =
          option.condition.operator === 'NOT' ? [] : option.condition.requiredTags;
        const condForbidden =
          option.condition.operator === 'NOT' ? option.condition.requiredTags : [];
        return processSpawnEvent(
          notification.time,
          option.bullets,
          condRequired,
          condForbidden,
        );
      });
    }

    if (notification.type === NotificationType.APPLY_BUFF) {
      return notification.buffs.flatMap((buffId) => {
        const buff = buffMap[buffId];
        if (!buff) return [];
        return [toBuffEventWithTags(buff, notification.time)];
      });
    }

    return [];
  });

  for (const id of onStartBuffs) {
    const buff = buffMap[id];
    if (!buff) continue;
    events.push(toBuffEventWithTags(buff, 0));
  }

  for (const id of onEndBuffs) {
    const buff = buffMap[id];
    if (!buff) continue;
    events.push(toBuffEventWithTags(buff, endTime));
  }

  const groups = Object.groupBy(events, (event) => getGroupKey(event));
  const result = Object.values(groups).flatMap((group) => {
    if (!group || group.length === 0) return [];
    const { requiredTags, forbiddenTags } = group[0];
    return {
      requiredTags,
      forbiddenTags,
      events: group.map((event) => {
        const { requiredTags: _, forbiddenTags: _2, ...rest } = event;
        return rest;
      }),
    };
  });
  return result;
};

const getGroupKey = (options: {
  requiredTags: Array<string>;
  forbiddenTags: Array<string>;
}) => {
  return JSON.stringify({
    requiredTags: options.requiredTags.toSorted(),
    forbidenTags: options.forbiddenTags.toSorted(),
  });
};

const toDamageEventsWithTags = (
  damage: DamageInstance,
  time: number,
  requiredTags: Array<string> = [],
  forbiddenTags: Array<string> = [],
): Array<TaggedEvent> => {
  const { alternativeMotionValue, type, ...mainDamage } = damage;
  const damageEventBase = {
    ...mainDamage,
    eventType: 'damage' as const,
    damageType: type,
    time,
  };
  const damageRequiredTags = alternativeMotionValue?.requiredTag;
  if (damageRequiredTags) {
    return [
      {
        ...damageEventBase,
        requiredTags,
        forbiddenTags: [...forbiddenTags, damageRequiredTags],
      },
      {
        ...damageEventBase,
        motionValue: alternativeMotionValue.motionValue,
        motionValuePerStack: alternativeMotionValue.motionValuePerStack,
        requiredTags: [...requiredTags, damageRequiredTags],
        forbiddenTags,
      },
    ];
  }
  return [{ ...damageEventBase, requiredTags, forbiddenTags }];
};

const toBuffEventWithTags = (
  buff: Buff,
  time: number,
  requiredTags: Array<string> = [],
  forbiddenTags: Array<string> = [],
): TaggedEvent => {
  return {
    requiredTags,
    forbiddenTags,
    eventType: 'buff' as const,
    time,
    ...buff,
  };
};
