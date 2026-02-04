import { compact } from 'es-toolkit/array';

import type { DetailedAttackInstance } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { useTeamAttacks } from './useTeamAttacks';

/**
 * Hook that combines stored attack instances from the rotation store
 * with full capability metadata from game data.
 *
 * Returns fully resolved AttackInstance objects for component consumption.
 */
export const useTeamAttackInstances = () => {
  const storedAttacks = useRotationStore((state) => state.attacks);
  const { attacks: gameDataAttacks, isLoading, isError } = useTeamAttacks();

  const attackMap = new Map(gameDataAttacks.map((attack) => [attack.id, attack]));
  const fullAttacks: Array<DetailedAttackInstance> = compact(
    storedAttacks.map((stored) => {
      const gameData = attackMap.get(stored.id);
      if (!gameData) return undefined;

      const parameters = gameData.parameters?.map((param, index) => ({
        ...param,
        value: stored.parameterValues?.[index] ?? param.minimum,
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
      };
    }),
  );

  return { attacks: fullAttacks, isError, isLoading };
};
