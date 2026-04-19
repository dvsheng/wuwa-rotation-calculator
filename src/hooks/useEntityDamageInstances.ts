import { useSuspenseQuery } from '@tanstack/react-query';

import { listEntityDamageInstances } from '@/services/game-data-v2/damage-instances';

export const useEntityDamageInstances = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-damage-instances', id],
    queryFn: () => listEntityDamageInstances({ data: { id } }),
    staleTime: Infinity,
  });
};
