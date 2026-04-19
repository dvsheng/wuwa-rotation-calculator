import { useSuspenseQuery } from '@tanstack/react-query';

import { listEntityModifiers } from '@/services/game-data-v2/modifiers';

export const useEntityModifiers = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-modifiers', id],
    queryFn: () => listEntityModifiers({ data: { id } }),
    staleTime: Infinity,
  });
};
