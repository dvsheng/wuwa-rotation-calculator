import { useSuspenseQuery } from '@tanstack/react-query';

import { listEchoSets } from '@/services/game-data/echo-set/list-echo-sets';

export const useEchoSetList = () => {
  return useSuspenseQuery({
    queryKey: ['echo-sets'],
    queryFn: listEchoSets,
    staleTime: Infinity,
  });
};
