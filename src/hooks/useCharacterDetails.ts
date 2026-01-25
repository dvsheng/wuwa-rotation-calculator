import { useQuery } from '@tanstack/react-query';

import { getCharacterDetails } from '@/services/game-data/character/get-character-details';

export const useCharacterDetails = (characterId: string) => {
  return useQuery({
    queryKey: ['character-details', characterId],
    queryFn: () => {
      return getCharacterDetails({ data: characterId });
    },
    staleTime: Infinity,
    enabled: !!characterId,
  });
};
