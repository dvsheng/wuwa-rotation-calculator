import { useSuspenseQuery } from '@tanstack/react-query';

import { listEntityActivatableSkills } from '@/services/game-data-v2/activatable-skills';

export const useEntityActivatableSkills = (id: number) => {
  return useSuspenseQuery({
    queryKey: ['game-data-v2-entity-activatable-skills', id],
    queryFn: () => listEntityActivatableSkills({ data: { id } }),
    staleTime: Infinity,
  });
};
