import { useMutation } from '@tanstack/react-query';

import { calculateRotation } from '@/services/rotation-calculator/rotation-bridge';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

export const useRotationCalculation = () => {
  const team = useTeamStore((state) => state.team);
  const enemy = useTeamStore((state) => state.enemy);
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);

  return useMutation({
    mutationKey: ['rotation-calculation'],
    mutationFn: () => calculateRotation(team, enemy, attacks, buffs),
  });
};
