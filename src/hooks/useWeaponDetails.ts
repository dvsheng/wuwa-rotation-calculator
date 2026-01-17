import { useQuery } from '@tanstack/react-query';

import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';

export const useWeaponDetails = (name: string | null) => {
  return useQuery({
    queryKey: ['weaponDetails', name],
    queryFn: () => getWeaponDetails({ data: name! }),
    enabled: !!name,
  });
};
