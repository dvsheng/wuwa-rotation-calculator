import { useSuspenseQuery } from '@tanstack/react-query';

import { getEntityDetails, listEntities } from '@/services/admin';
import type { EntityType } from '@/services/game-data';

export interface UseEntitiesOptions {
  entityType?: EntityType;
  search?: string;
}

export type EntityListItem = Awaited<ReturnType<typeof useEntities>>['data'][number];

export type DetailedEntity = ReturnType<typeof useEntity>['data'];

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

export const useEntity = (entityId: number) => {
  return useSuspenseQuery({
    queryKey: ['entity-details', entityId],
    queryFn: () => getEntityDetails({ data: { id: entityId } }),
    staleTime: Infinity,
  });
};
