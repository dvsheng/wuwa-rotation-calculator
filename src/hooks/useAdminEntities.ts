import { useSuspenseQuery } from '@tanstack/react-query';

import { getAdminEntityDetails, listAdminEntities } from '@/services/admin';
import type { EntityType } from '@/services/game-data';

export interface UseAdminEntitiesOptions {
  entityType?: EntityType;
  search?: string;
}

export type AdminEntity = Awaited<ReturnType<typeof useAdminEntities>>['data'][number];

export type DetailedAdminEntity = ReturnType<typeof useAdminEntity>['data'];

export const useAdminEntities = ({ entityType, search }: UseAdminEntitiesOptions) => {
  const query = useSuspenseQuery({
    queryKey: ['admin-entities'],
    queryFn: () => listAdminEntities(),
    staleTime: Infinity,
    retry: false,
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

export const useAdminEntity = (entityId: number) => {
  return useSuspenseQuery({
    queryKey: ['admin-entity-details', entityId],
    queryFn: () => getAdminEntityDetails({ data: { id: entityId } }),
    staleTime: Infinity,
    retry: false,
  });
};
