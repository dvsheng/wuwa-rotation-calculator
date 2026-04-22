import type { EntityResource } from '../create-entity-resource-lister';
import type { MontageAsset } from '../repostiory';

export const NotificationType = {
  SPAWN_BULLETS: 'spawnBullets',
  ADD_TAG: 'addTag',
  APPLY_BUFF: 'applyBuff',
  SEND_EVENT: 'sendEvent',
  DYNAMIC_BEHAVIOR: 'dynamicBehavior',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

interface BaseNotification {
  time: number;
  type: NotificationType;
}

export interface Condition {
  operator?: 'NOT';
  requiredTags: Array<string>;
}

export interface DynamicBehaviorOption {
  condition: Condition;
  bullets: Array<number>;
  buffs: Array<number>;
  tags: Array<string>;
}

export interface DynamicBehaviorNotification extends BaseNotification {
  type: 'dynamicBehavior';
  options: Array<DynamicBehaviorOption>;
}

export interface SpawnBulletsNotification extends BaseNotification {
  type: 'spawnBullets';
  bullets: Array<number>;
}

export interface ApplyBuffNotification extends BaseNotification {
  type: 'applyBuff';
  buffs: Array<number>;
  duration?: number;
}

export interface AddTagNotification extends BaseNotification {
  type: 'addTag';
  name: string;
  duration?: number;
}

export interface SendEventNotification extends BaseNotification {
  type: 'sendEvent';
  name: string;
}

export type Notification =
  | SpawnBulletsNotification
  | AddTagNotification
  | SendEventNotification
  | ApplyBuffNotification
  | DynamicBehaviorNotification;

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
