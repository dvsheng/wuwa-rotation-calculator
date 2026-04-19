import type { EntityResource } from '../create-entity-resource-lister';
import type { ReBulletDataMainRow } from '../repostiory';

export interface BulletData {
  id: string;
  name: string;
  hits: Array<number>;
  hitsPerTarget: number;
  totalHitCap: number;
  hitInterval: number;
  duration: number;
  /**
   * Tags that must be active to fire th bullet
   */
  requiredTags: Array<string>;
  /**
   * Tags that suppress the bullet from firing if present
   */
  forbiddenTags: Array<string>;
  shouldDestroyOnSkillEnd: boolean;
  children: Array<{
    bulletId: string;
    delay: number;
    count: number;
  }>;
  onHitBuffs: {
    attacker: Array<number>;
    victim: Array<number>;
    energy: Array<number>;
    onField: Array<number>;
  };
}

export type Bullet = EntityResource<BulletData, ReBulletDataMainRow>;
