import { useQuery } from '@tanstack/react-query';

import type { IconRequest } from '@/schemas/game-data-service';
import { getIcons } from '@/services/game-data';

/**
 * Hook to fetch icon URLs for multiple items by their IDs and types.
 * Supports attacks, modifiers, and entities.
 * Returns an array of IconResponse objects with iconUrl appended.
 */
export const useIcons = (requests: Array<IconRequest>) => {
  const sortedRequests = requests.toSorted((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.id - b.id;
  });

  return useQuery({
    queryKey: ['icons', sortedRequests],
    queryFn: () => getIcons({ data: requests }),
    enabled: requests.length > 0,
    staleTime: Infinity,
  });
};

/**
 * Hook to fetch the icon URL for a single capability by its ID and type.
 */
export const useCapabilityIcon = (capabilityId: number) => {
  const { data, ...rest } = useIcons([{ id: capabilityId, type: 'capability' }]);
  return {
    ...rest,
    data: data?.[0]?.iconUrl,
  };
};

/**
 * Hook to fetch the icon URL for a single entity by its ID.
 */
export const useEntityIcon = (entityId: number) => {
  const { data, ...rest } = useIcons([{ id: entityId, type: 'entity' }]);
  return {
    ...rest,
    data: data?.[0]?.iconUrl,
  };
};
