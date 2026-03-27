import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/services/game-data';
import { listEntities } from '@/services/game-data';
import { listCapabilities } from '@/services/game-data/list-capabilities.function';
import { listSkills } from '@/services/game-data/list-skills.function';

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
    queryKey: ['entity-capabilities', entityId],
    queryFn: () => listCapabilities({ data: { entityIds: [entityId] } }),
    staleTime: Infinity,
  });
};

export const useEntitySkills = (entityId: number) => {
  return useSuspenseQuery({
    queryKey: ['entity-skills', entityId],
    queryFn: () => listSkills({ data: { entityIds: [entityId] } }),
    staleTime: Infinity,
  });
};
