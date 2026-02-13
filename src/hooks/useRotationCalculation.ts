import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';

export const useRotationCalculation = () => {
  const team = useStore((state) => state.team);
  const enemy = useStore((state) => state.enemy);
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);

  return useQuery({
    queryKey: ['rotation-calculation', team, enemy, attacks, buffs],
    queryFn: async () => {
      const result = await calculateRotation({
        data: {
          team: team,
          enemy,
          attacks,
          buffs,
        },
      });
      return result;
    },
    placeholderData: keepPreviousData,
    enabled: false,
    retry: false,
  });
};
