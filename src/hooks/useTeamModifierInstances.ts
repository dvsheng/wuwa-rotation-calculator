import { compact } from 'es-toolkit/array';

import { Target } from '@/services/game-data';
import { TUNE_STRAIN_BUFF_ID } from '@/services/rotation-calculator/tune-strain';
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
      // Virtual tune strain buff: not backed by a game-data capability
      if (stored.id === TUNE_STRAIN_BUFF_ID) {
        const storedParameter = stored.parameterValues?.find((p) => p.id === '0');
        return {
          ...stored,
          name: 'Tune Strain',
          parentName: 'Other',
          description: 'Apply Tune Strain stacks to the enemy.',
          characterId: 0,
          characterName: 'All Characters',
          originType: 'Tune Break' as const,
          target: Target.ENEMY,
          parameters: [
            {
              id: '0',
              minimum: 0,
              maximum: 10,
              value: storedParameter?.value,
              valueConfiguration: storedParameter?.valueConfiguration,
            },
          ],
        };
      }

      const gameData = buffMap.get(`${stored.characterId}:${stored.id}`);
      if (!gameData) return;
      const parameters = gameData.parameters?.map((parameter) => {
        const storedParameter = stored.parameterValues?.find(
          (p) => p.id === parameter.id,
        );
        return {
          ...parameter,
          value: storedParameter?.value,
          valueConfiguration: storedParameter?.valueConfiguration,
        };
      });
      return {
        ...stored,
        name: gameData.name,
        parentName: gameData.parentName,
        description: gameData.description,
        characterName: gameData.characterName,
        originType: gameData.originType,
        target: gameData.target,
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
