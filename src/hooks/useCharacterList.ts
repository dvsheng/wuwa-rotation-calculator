import { useSuspenseQuery } from '@tanstack/react-query';

import { listCharacters } from '@/services/game-data/character/list-characters';
import type { WeaponType } from '@/types';

export const useCharacterList = (weaponType?: WeaponType) => {
  return useSuspenseQuery({
    queryKey: ['characters', { weaponType }],
    queryFn: () => listCharacters(weaponType),
  });
};
