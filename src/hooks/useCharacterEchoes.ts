import { useMutation } from '@tanstack/react-query';

import { getEchoStats as getEchoStatsRequest } from '@/services/echo-stat-approximator/get-echo-stats.function';
import { useStore } from '@/store';

export const useCharacterEchoes = (index: number) => {
  const updateCharacter = useStore((state) => state.updateCharacter);

  const echoMutation = useMutation({
    mutationFn: (characterId: number) => getEchoStatsRequest({ data: { characterId } }),
    retry: false,
  });

  const syncCharacterEchoes = async (characterId: number) => {
    const response = await echoMutation.mutateAsync(characterId);

    if (useStore.getState().team[index]?.id !== characterId) {
      return;
    }

    updateCharacter(index, (draft) => {
      draft.echoStats = response.echoes;
    });
  };

  return {
    isLoadingEchoes: echoMutation.isPending,
    syncCharacterEchoes,
  };
};
