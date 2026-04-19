import type { Bullet } from './types';

export const transformBulletsToTimedHits = (
  bullet: Bullet,
  getBulletById: (id: Bullet['id']) => Bullet | undefined,
  startTime = 0,
): Array<{ damageId: number; time: number }> => {
  const result = Array.from({ length: bullet.hitsPerTarget }, (_, index) =>
    bullet.hits.map((hit) => ({
      damageId: hit,
      time: startTime + index * bullet.hitInterval,
    })),
  ).flat();

  for (const child of bullet.children) {
    const childBullet = getBulletById(child.bulletId);
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

  return result.filter((damage) => damage.damageId !== 0);
};
