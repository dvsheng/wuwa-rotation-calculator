import { useSuspenseQuery } from '@tanstack/react-query';

import { getEntityBuffs } from '@/services/game-data-v2/buffs';

export const useEntityBuffs = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-buffs', id],
    queryFn: () => getEntityBuffs({ data: { id } }),
    staleTime: Infinity,
  });
};
