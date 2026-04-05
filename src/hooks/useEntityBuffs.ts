import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { getEntityBuffs } from '@/services/game-data-v2/buffs';

export const useEntityBuffs = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-buffs', id, entityType],
    queryFn: () => getEntityBuffs({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
