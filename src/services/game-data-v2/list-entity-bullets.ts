import { reBulletDataMainRows } from './repostiory';
import type { ReBulletDataMainRow } from './repostiory';

/** Transformed row output from RE_Bullet_Data_Main_Rows */
export interface Bullet {
  // DT_ReBulletDataMain
  id: string;
  // zi dan ming chen
  name: string;
  // shanghai id or duo shanghai id, array of damage ids
  hits: Array<number>;
  // Duration in seconds between each hit
  hitInterval: number;
  duration: number;
  persistent: number;
  shouldDestroyOnSkillEnd: boolean;
  children: Array<{
    bulletId: number;
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

export const listEntityBullets = (
  entityId: number,
  repository: typeof reBulletDataMainRows = reBulletDataMainRows,
): Array<Bullet> => {
  const bulletRows = getBulletsByEntityId(entityId, repository);
  const bullets = bulletRows.map((bullet) => transformBulletRowToBullet(bullet));
  return bullets;
};

const getBulletsByEntityId = (
  entityId: number,
  repository: typeof reBulletDataMainRows,
): Array<ReBulletDataMainRow> => {};

const transformBulletRowToBullet = (row: ReBulletDataMainRow): Bullet => {};
