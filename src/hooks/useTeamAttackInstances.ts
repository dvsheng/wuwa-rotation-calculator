import { compact } from 'es-toolkit/array';

import { useStore } from '@/store';

import { useTeamDetails } from './useTeamDetails';

export type DetailedAttackInstance = ReturnType<
  typeof useTeamAttackInstances
>['attacks'][number];

/**
 * Hook that combines stored attack instances from the rotation store
 * with full capability metadata from game data.
 *
 * Returns fully resolved AttackInstance objects for component consumption.
 */
export const useTeamAttackInstances = () => {
  const storedAttacks = useStore((state) => state.attacks);
  const { attacks: gameDataAttacks, isLoading, isError } = useTeamDetails();

  const attackMap = new Map(
    gameDataAttacks.map((attack) => [`${attack.characterId}:${attack.id}`, attack]),
  );
  const fullAttacks = compact(
    storedAttacks.map((stored) => {
      const gameData = attackMap.get(`${stored.characterId}:${stored.id}`);
      if (!gameData) return;

      const parameters = gameData.parameters?.map((parameter) => ({
        ...parameter,
        value: stored.parameterValues?.find((p) => p.id === parameter.id)?.value,
      }));

      return {
        instanceId: stored.instanceId,
        id: gameData.id,
        name: gameData.name,
        parentName: gameData.parentName,
        description: gameData.description,
        characterId: gameData.characterId,
        characterName: gameData.characterName,
        originType: gameData.originType,
        parameters,
      };
    }),
  );

  return { attacks: fullAttacks, isError, isLoading };
};
