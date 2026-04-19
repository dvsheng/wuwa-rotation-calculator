import { EntityType } from '@/services/game-data/types';

import {
  echoSetEffects,
  echoSets,
  resonatorChains,
  resonatorSkills,
  weaponEffects,
  weapons,
} from '../repostiory';

import type { EntitySkillRepositoryRow } from './types';

export async function fetchResourcesForEntity(
  entityId: number,
  entityType: EntityType,
): Promise<Array<EntitySkillRepositoryRow>> {
  switch (entityType) {
    case EntityType.CHARACTER: {
      const [allSkills, allChains] = await Promise.all([
        resonatorSkills.list(),
        resonatorChains.list(),
      ]);

      return [
        ...allSkills.filter((s) => s.skillGroupId === entityId && s.skillType !== 7),
        ...allChains.filter((c) => c.groupId === entityId),
      ];
    }
    case EntityType.WEAPON: {
      const weapon = await weapons.get(entityId);
      if (!weapon) throw new Error('invalid id');

      const allEffects = await weaponEffects.list();
      const resonEffects = allEffects.filter(
        (effect) => effect.resonId === weapon.resonId,
      );
      if (resonEffects.length === 0) return [];

      const seen = new Set<number>();
      return resonEffects
        .toSorted((a, b) => a.id - b.id)
        .filter((effect) => {
          if (seen.has(effect.resonId)) return false;
          seen.add(effect.resonId);
          return true;
        });
    }
    case EntityType.ECHO_SET: {
      const echoSet = await echoSets.get(entityId);
      if (!echoSet) throw new Error('invalid id');

      const fetterMap = echoSet.fetterMap as Array<{ Key: number; Value: number }>;
      const fetterIds = new Set(fetterMap.map((entry) => entry.Value));

      const allEffects = await echoSetEffects.list();
      return allEffects.filter((f) => fetterIds.has(f.id));
    }
    case EntityType.ECHO: {
      return [];
    }
  }
}
