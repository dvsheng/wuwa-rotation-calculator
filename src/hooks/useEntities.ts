import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data';
import { listEntities } from '@/services/game-data';
import { listEntityCapabilities } from '@/services/game-data/list-entity-capabilities.function';

export interface UseEntitiesOptions {
  entityType?: EntityType;
  search?: string;
}

export type EntityListItem = Awaited<ReturnType<typeof useEntities>>['data'][number];

export const useEntities = ({ entityType, search }: UseEntitiesOptions) => {
  const query = useSuspenseQuery({
    queryKey: ['entities'],
    queryFn: () => listEntities(),
    staleTime: Infinity,
  });

  const normalizedSearch = search?.trim().toLowerCase();
  const filteredData = query.data.filter((row) => {
    if (entityType && row.type !== entityType) {
      return false;
    }
    if (normalizedSearch && !row.name.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    return true;
  });

  return { ...query, data: filteredData };
};

export const useEntityCapabilities = (entityId: number) => {
  return useSuspenseQuery({
    queryKey: ['entity-details', entityId],
    queryFn: () => listEntityCapabilities({ data: { id: entityId } }),
    staleTime: Infinity,
  });
};
