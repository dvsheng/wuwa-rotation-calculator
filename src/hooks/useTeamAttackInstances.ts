import { compact } from 'es-toolkit/array';

import type { AttackInstance } from '@/schemas/rotation';
import { useRotationStore } from '@/store/useRotationStore';

import { useTeamDetails } from './useTeamDetails';

export type DetailedAttackInstance = AttackInstance &
  ReturnType<typeof useTeamDetails>['attacks'][number];

export interface UseTeamAttackInstancesResult {
  attacks: Array<DetailedAttackInstance>;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook that combines stored attack instances from the rotation store
 * with full capability metadata from game data.
 *
 * Returns fully resolved AttackInstance objects for component consumption.
 */
export const useTeamAttackInstances = (): UseTeamAttackInstancesResult => {
  const storedAttacks = useRotationStore((state) => state.attacks);
  const { attacks: gameDataAttacks, isLoading, isError } = useTeamDetails();

  const attackMap = new Map(gameDataAttacks.map((attack) => [attack.id, attack]));
  const fullAttacks: Array<DetailedAttackInstance> = compact(
    storedAttacks.map((stored) => {
      const gameData = attackMap.get(stored.id);
      if (!gameData) return;

      const parameters = gameData.parameters?.map((parameter, index) => ({
        ...parameter,
        value: stored.parameterValues?.[index] ?? parameter.minimum,
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
