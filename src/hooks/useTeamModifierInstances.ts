import { compact } from 'es-toolkit/array';

import type { DetailedModifierInstance } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { useTeamModifiers } from './useTeamModifiers';

/**
 * Hook that combines stored modifier instances from the rotation store
 * with full capability metadata from game data.
 *
 * Returns fully resolved ModifierInstance objects for component consumption.
 */
export const useTeamModifierInstances = () => {
  const storedBuffs = useRotationStore((state) => state.buffs);
  const { buffs: gameDataBuffs, isLoading, isError } = useTeamModifiers();

  const buffMap = new Map(gameDataBuffs.map((buff) => [buff.id, buff]));
  const fullBuffs: Array<DetailedModifierInstance> = compact(
    storedBuffs.map((stored) => {
      const gameData = buffMap.get(stored.id);
      if (!gameData) return;
      const parameters = gameData.parameters?.map((parameter, index) => ({
        ...parameter,
        value: stored.parameterValues?.[index],
      }));
      return {
        instanceId: stored.instanceId,
        id: gameData.id,
        name: gameData.name,
        parentName: gameData.parentName,
        description: gameData.description,
        characterId: gameData.characterId,
        characterName: gameData.characterName,
        parameters,
        x: stored.x,
        y: stored.y,
        w: stored.w,
        h: stored.h,
      };
    }),
  );

  return {
    buffs: fullBuffs,
    isError,
    isLoading,
  };
};
