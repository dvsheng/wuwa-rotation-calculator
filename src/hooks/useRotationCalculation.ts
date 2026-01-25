import { useQuery } from '@tanstack/react-query';

import { calculateRotation } from '@/services/rotation-calculator/rotation-bridge';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

export const useRotationCalculation = () => {
  const team = useTeamStore((state) => state.team);
  const enemy = useTeamStore((state) => state.enemy);
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);

  return useQuery({
    queryKey: ['rotation-calculation', team, enemy, attacks, buffs],
    queryFn: () => calculateRotation(team, enemy, attacks, buffs),
    enabled: attacks.length > 0,
  });
};
