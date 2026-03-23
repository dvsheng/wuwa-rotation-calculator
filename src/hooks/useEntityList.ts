import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data';
import { listEntities } from '@/services/game-data';

export interface UseEntityListOptions {
  entityType?: EntityType;
}

export const useEntityList = ({ entityType }: UseEntityListOptions) => {
  const query = useSuspenseQuery({
    queryKey: ['entity'],
    queryFn: () => listEntities(),
    staleTime: Infinity,
    retry: 10,
  });

  const data = entityType
    ? query.data.filter((row) => row.type === entityType)
    : query.data;

  return { ...query, data };
};
