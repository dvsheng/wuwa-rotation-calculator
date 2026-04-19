import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data/types';
import { listEntities } from '@/services/game-data-v2/list-entities.function';

export interface UseGameDataEntitiesOptions {
  entityType?: EntityType;
  search?: string;
}

export type GameDataEntity = Awaited<ReturnType<typeof listEntities>>[number];

export const useGameDataEntities = ({
  entityType,
  search,
}: UseGameDataEntitiesOptions) => {
  const query = useSuspenseQuery({
    queryKey: ['game-data-v2-entities'],
    queryFn: () => listEntities(),
    staleTime: Infinity,
  });

  const normalizedSearch = search?.trim().toLowerCase();
  const filteredData = query.data.filter((row) => {
    if (entityType && row.type !== entityType) return false;
    if (normalizedSearch && !row.name.toLowerCase().includes(normalizedSearch))
      return false;
    return true;
  });

  return { ...query, data: filteredData };
};
