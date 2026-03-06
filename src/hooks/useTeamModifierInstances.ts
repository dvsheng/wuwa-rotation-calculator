import { compact } from 'es-toolkit/array';

import { useStore } from '@/store';

import { useTeamDetails } from './useTeamDetails';

export type DetailedModifierInstance = ReturnType<
  typeof useTeamModifierInstances
>['buffs'][number];

/**
 * Hook that combines stored modifier instances from the rotation store
 * with full capability metadata from game data.
 *
 * Returns fully resolved ModifierInstance objects for component consumption.
 */
export const useTeamModifierInstances = () => {
  const storedBuffs = useStore((state) => state.buffs);
  const { buffs: gameDataBuffs, isLoading, isError } = useTeamDetails();

  const buffMap = new Map(
    gameDataBuffs.map((buff) => [`${buff.characterId}:${buff.id}`, buff]),
  );
  const fullBuffs = compact(
    storedBuffs.map((stored) => {
      const gameData = buffMap.get(`${stored.characterId}:${stored.id}`);
      if (!gameData) return;
      const parameters = gameData.parameters?.map((parameter) => {
        const storedParameter = stored.parameterValues?.find(
          (p) => p.id === parameter.id,
        );
        return {
          ...parameter,
          ...storedParameter,
        };
      });
      return {
        ...stored,
        ...gameData,
        parameters,
      };
    }),
  );

  return {
    buffs: fullBuffs,
    isError,
    isLoading,
  };
};
