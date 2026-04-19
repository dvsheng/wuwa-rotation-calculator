import { EntityType } from '@/services/game-data/types';

import { reBulletDataMainRows } from '../repostiory';
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
    case EntityType.ECHO:
    case EntityType.ECHO_SET:
    case EntityType.WEAPON: {
      return [];
    }
  }
}
