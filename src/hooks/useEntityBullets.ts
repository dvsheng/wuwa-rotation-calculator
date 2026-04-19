import { useSuspenseQuery } from '@tanstack/react-query';

import { listEntityBullets } from '@/services/game-data-v2/bullets';

export const useEntityBullets = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-bullets', id],
    queryFn: () => listEntityBullets({ data: { id } }),
    staleTime: Infinity,
  });
};
