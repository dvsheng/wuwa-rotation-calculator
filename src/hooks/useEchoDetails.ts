import { useQuery } from '@tanstack/react-query';

import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';

export const useEchoDetails = (name: string | null) => {
  return useQuery({
    queryKey: ['echoDetails', name],
    queryFn: () => getEchoDetails({ data: name! }),
    enabled: !!name,
  });
};
