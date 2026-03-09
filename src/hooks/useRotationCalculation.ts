import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { calculateRotation } from '@/services/rotation-calculator/calculate-client-rotation-damage';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import { useStore } from '@/store';

import type { DetailedAttackInstance } from './useTeamAttackInstances';
import { useTeamAttackInstances } from './useTeamAttackInstances';

type DamageDetail = ClientRotationResult['damageDetails'][number];

export interface RotationResultMergedDamageDetail {
  detail: DamageDetail;
  attack: DetailedAttackInstance | undefined;
}

export type RotationCalculationResult = ClientRotationResult & {
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
  attackCount: number;
};

export const useRotationCalculation = () => {
  const team = useStore((state) => state.team);
  const enemy = useStore((state) => state.enemy);
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);
  const { attacks: resolvedAttacks } = useTeamAttackInstances();

  const calculationQuery = useQuery({
    queryKey: ['rotation-calculation', team, enemy, attacks, buffs],
    queryFn: async () => {
      const result = await calculateRotation({
        data: {
          team: team,
          enemy,
          attacks,
          buffs,
        },
      });
      return result;
    },
    placeholderData: keepPreviousData,
    enabled: false,
    retry: false,
  });

  const attackMap = new Map(
    resolvedAttacks.map((attack) => [attack.instanceId, attack]),
  );
  const mergedDamageDetails =
    calculationQuery.data?.damageDetails.map((detail) => {
      const attack = attackMap.get(attacks[detail.attackIndex].instanceId);
      return {
        detail,
        attack,
      };
    }) ?? [];
  const attackCount = new Set(
    mergedDamageDetails.map((mergedDetail) => mergedDetail.detail.attackIndex),
  ).size;

  return {
    ...calculationQuery,
    data: calculationQuery.data
      ? ({
          ...calculationQuery.data,
          mergedDamageDetails,
          attackCount,
        } satisfies RotationCalculationResult)
      : undefined,
  };
};
