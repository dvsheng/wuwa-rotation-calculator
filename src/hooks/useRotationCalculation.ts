import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { compact } from 'es-toolkit/array';

import { attackCount as countDistinctAttacks } from '@/components/rotation-builder/results/result-pipelines';
import type { AttackDamageInstance } from '@/services/game-data';
import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { useStore } from '@/store';

import { useTeamCharacters } from './useCharacter';
import type { DetailedAttackInstance } from './useTeamAttackInstances';
import { useTeamAttackInstances } from './useTeamAttackInstances';

type DamageDetail = ClientRotationResult['damageDetails'][number];

export type RotationResultMergedDamageDetail = DamageDetail &
  DetailedAttackInstance &
  AttackDamageInstance & {
    characterName: string;
    characterId: number;
    characterIconUrl?: string;
  };

export type RotationCalculationResult = ClientRotationResult & {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  attackCount: number;
};

/**
 * Fetches rotation result data and enriches it with team / attack details
 * @returns
 */
export const useRotationCalculation = () => {
  const team = useStore((state) => state.team);
  const enemy = useStore((state) => state.enemy);
  const buffs = useStore((state) => state.buffs);
  const { attacks } = useTeamAttackInstances();
  const characters = useTeamCharacters();
  const { data, ...rest } = useQuery({
    queryKey: ['rotation-calculation', team, enemy, attacks, buffs],
    queryFn: async () => {
      return await calculateRotation({
        data: { team, enemy, attacks, buffs },
      });
    },
    placeholderData: keepPreviousData,
    enabled: false,
  });

  const attackMap = new Map(attacks.map((attack) => [attack.instanceId, attack]));
  const mergedDamageDetails = data
    ? compact(
        data.damageDetails.map((detail) => {
          const attack = attackMap.get(attacks[detail.attackIndex]?.instanceId);
          const character = characters.find((c) => c.index === detail.characterIndex);
          if (!attack) return;
          if (!character) return;
          const damageInstance = attack.damageInstances[detail.damageInstanceIndex];
          return {
            ...attack,
            ...damageInstance,
            ...detail,
            characterName: character.name,
            characterId: character.id,
            characterIconUrl: character.iconUrl,
          };
        }),
      )
    : [];
  return {
    ...rest,
    data: data
      ? ({
          ...data,
          mergedDamageDetails,
          attackCount: countDistinctAttacks(mergedDamageDetails),
        } satisfies RotationCalculationResult)
      : undefined,
  };
};
