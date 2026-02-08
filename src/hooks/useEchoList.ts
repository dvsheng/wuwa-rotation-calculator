import { useQuery } from '@tanstack/react-query';

import { listEchoes } from '@/services/game-data/list-echoes';

export const useEchoList = () => {
  return useQuery({
    queryKey: ['echoes'],
    queryFn: () => listEchoes(),
  });
};
