import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntityAttacks } from '@/services/game-data-v2/attacks';

export const useEntityAttacks = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-attacks', id, entityType],
    queryFn: () => listEntityAttacks({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
