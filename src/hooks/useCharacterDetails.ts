import { useQuery } from '@tanstack/react-query';

import { getCharacterDetails } from '@/services/game-data/character/get-character-details';

export const useCharacterDetails = (characterName: string) => {
  return useQuery({
    queryKey: ['character-details', characterName],
    queryFn: () => {
      return getCharacterDetails({ data: characterName });
    },
    staleTime: Infinity,
  });
};
