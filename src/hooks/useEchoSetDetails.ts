import { useQuery } from '@tanstack/react-query';

import { getEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';

export const useEchoSetDetails = (name: string | null) => {
  return useQuery({
    queryKey: ['echoSetDetails', name],
    queryFn: () => getEchoSetDetails({ data: name! }),
    enabled: !!name,
  });
};
