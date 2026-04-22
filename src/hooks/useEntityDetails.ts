import { useSuspenseQuery } from '@tanstack/react-query';

import { getEntityDetails } from '@/services/game-data-v2/get-entity-details.function';

export const useEntityDetails = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-details', id],
    queryFn: () => getEntityDetails({ data: { id } }),
    staleTime: Infinity,
  });
};
