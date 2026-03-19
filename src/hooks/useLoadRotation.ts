import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { SavedRotation } from '@/schemas/library';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import { useStore } from '@/store';

type LoadableRotation = Pick<SavedRotation, 'name' | 'data'>;

export const useLoadRotation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setTeam, setEnemy, setAttacks, setBuffs } = useStore();

  return async (rotation: LoadableRotation) => {
    const toastId = toast.loading(`Loading rotation: ${rotation.name}`);

    try {
      setTeam(rotation.data.team);
      setEnemy(rotation.data.enemy);
      setAttacks(rotation.data.attacks);
      setBuffs(rotation.data.buffs);

      try {
        await queryClient.fetchQuery({
          queryKey: [
            'rotation-calculation',
            rotation.data.team,
            rotation.data.enemy,
            rotation.data.attacks,
            rotation.data.buffs,
          ],
          queryFn: () =>
            calculateRotation({
              data: {
                team: rotation.data.team,
                enemy: rotation.data.enemy,
                attacks: rotation.data.attacks,
                buffs: rotation.data.buffs,
              },
            }),
        });

        toast.success(`Loaded rotation: ${rotation.name}`, {
          id: toastId,
        });
        void navigate({ to: '/create', search: { tab: 'results' } });
      } catch (error) {
        console.warn('Failed to fetch rotation results while loading build:', error);
        toast.warning(`Loaded rotation: ${rotation.name}`, {
          id: toastId,
          description:
            'Rotation data loaded, but damage results could not be calculated.',
        });
        void navigate({ to: '/create', search: { tab: 'rotation' } });
      }
    } catch (error) {
      console.error('Failed to load rotation:', error);
      toast.error('Failed to load rotation.', {
        id: toastId,
      });
    }
  };
};
