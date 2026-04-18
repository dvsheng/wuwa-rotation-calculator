import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntityMontages } from '@/services/game-data-v2/montages';

export const useEntityMontages = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-montages', id, entityType],
    queryFn: () => listEntityMontages({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
