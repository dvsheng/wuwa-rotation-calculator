import type { EntityResource } from '../create-entity-resource-lister';
import type { MontageAsset } from '../repostiory';

export const NotificationType = {
  SPAWN_BULLETS: 'spawnBullets',
  ADD_TAG: 'addTag',
  SEND_EVENT: 'sendEvent',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

interface BaseNotification {
  time: number;
  type: NotificationType;
}

export interface SpawnBulletsNotification extends BaseNotification {
  type: 'spawnBullets';
  bullets: Array<{
    id: number;
    condition?: {
      requiredTags?: Array<string>;
    };
  }>;
}

export interface AddTagNotification extends BaseNotification {
  type: 'addTag';
  name: string;
  duration: number;
}

export interface SendEventNotification extends BaseNotification {
  type: 'sendEvent';
  name: string;
}

export type Notification =
  | SpawnBulletsNotification
  | AddTagNotification
  | SendEventNotification;

/**
 * An animation that stitches together a sequence of bullets, tags, and effects at specified time intervals
 */
export interface MontageData {
  name: string;
  characterName: string;
  notifications: Array<Notification>;
  endTime?: number;
  effectiveTime?: number;
}

export type Montage = EntityResource<MontageData, MontageAsset>;
