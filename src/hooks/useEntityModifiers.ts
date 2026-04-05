import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntityModifiers } from '@/services/game-data-v2/modifiers';

export const useEntityModifiers = (id: number, entityType: EntityType) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-modifiers', id, entityType],
    queryFn: () => listEntityModifiers({ data: { id, entityType } }),
    staleTime: Infinity,
  });
};
