import { compact } from 'es-toolkit/array';

import { CapabilityType, OriginType } from '@/services/game-data';
import { TUNE_BREAK_ATTACK_ID } from '@/services/game-data/tune-break';
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
      // Virtual tune break attack: not backed by a single game-data capability
      if (stored.isTuneBreakAttack ?? stored.id === TUNE_BREAK_ATTACK_ID) {
        return {
          capabilityType: CapabilityType.ATTACK,
          instanceId: stored.instanceId,
          id: TUNE_BREAK_ATTACK_ID,
          isTuneBreakAttack: true,
          name: 'Tune Break',
          parentName: 'Other',
          description:
            'Combined Tune Break damage from all characters with Tune Break capabilities.',
          characterId: 0,
          entityId: 0,
          characterName: 'All Characters',
          originType: OriginType.TUNE_BREAK,
          parameters: [] as Array<never>,
        };
      }

      const gameData = attackMap.get(`${stored.characterId}:${stored.id}`);
      if (!gameData) return;

      const parameters = gameData.parameters?.map((parameter) => ({
        ...parameter,
        value: stored.parameterValues?.find((p) => p.id === parameter.id)?.value,
        valueConfiguration: stored.parameterValues?.find((p) => p.id === parameter.id)
          ?.valueConfiguration,
      }));

      return {
        instanceId: stored.instanceId,
        id: gameData.id,
        isTuneBreakAttack: gameData.isTuneBreakAttack,
        name: gameData.name,
        parentName: gameData.parentName,
        description: gameData.description,
        characterId: gameData.characterId,
        entityId: gameData.entityId,
        characterName: gameData.characterName,
        originType: gameData.originType,
        capabilityType: gameData.capabilityType,
        parameters,
      };
    }),
  );

  return { attacks: fullAttacks, isError, isLoading };
};
