import type { Bullet } from './types';

export const transformBulletsToTimedHits = (
  bullet: Bullet,
  getBulletById: (id: Bullet['id']) => Bullet | undefined,
  startTime = 0,
): Array<{ damageId: number; time: number }> => {
  const result: Array<{ damageId: number; time: number }> = [];

  const hitTimes = computeHitTimes(bullet.hitInterval, bullet.duration, startTime);

  for (const time of hitTimes) {
    for (const damageId of bullet.hits) {
      result.push({ damageId, time });
    }
  }

  for (const child of bullet.children) {
    const childBullet = getBulletById(String(child.bulletId));
    if (!childBullet) {
      continue;
    }

    const childHits = transformBulletsToTimedHits(
      childBullet,
      getBulletById,
      startTime + child.delay,
    );
    for (let index = 0; index < child.count; index++) {
      result.push(...childHits);
    }
  }

  return result;
};

const computeHitTimes = (
  hitInterval: number,
  duration: number,
  startTime: number,
): Array<number> => {
  if (hitInterval <= 0 || duration <= 0) {
    return [startTime];
  }
  const times: Array<number> = [];
  for (let t = startTime; t <= startTime + duration; t += hitInterval) {
    times.push(t);
  }
  return times;
};
