import { EntityType } from '@/services/game-data/types';

import { echoes, reBulletDataMainRows } from '../repostiory';
import type { ReBulletDataMainRow } from '../repostiory';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<ReBulletDataMainRow>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const bullets = await reBulletDataMainRows.list();
      return bullets.filter((bullet) =>
        String(bullet.bulletId).startsWith(String(entityId)),
      );
    }
    case EntityType.ECHO: {
      const echo = await echoes.get(entityId);
      if (!echo) throw new Error('invalid id');

      const bulletIdPrefix = String(echo.skillId).slice(0, 5);
      const bullets = await reBulletDataMainRows.list();
      return bullets.filter((bullet) =>
        String(bullet.bulletId).startsWith(bulletIdPrefix),
      );
    }
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}
