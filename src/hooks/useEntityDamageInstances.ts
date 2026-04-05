import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntityDamageInstances } from '@/services/game-data-v2/damage-instances';

export const useEntityDamageInstances = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-damage-instances', id, entityType],
    queryFn: () => listEntityDamageInstances({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
