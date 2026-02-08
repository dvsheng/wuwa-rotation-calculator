import { useSuspenseQuery } from '@tanstack/react-query';

import { listWeapons } from '@/services/game-data/list-weapons';
import type { WeaponType } from '@/types';

export const useWeaponList = (weaponType?: WeaponType) => {
  return useSuspenseQuery({
    queryKey: ['weapons', { weaponType }],
    queryFn: () => listWeapons(weaponType),
  });
};
