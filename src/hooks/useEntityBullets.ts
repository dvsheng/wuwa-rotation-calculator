import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntityBullets } from '@/services/game-data-v2/bullets';

export const useEntityBullets = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-bullets', id, entityType],
    queryFn: () => listEntityBullets({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
