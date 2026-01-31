import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { RotationSchema } from '@/schemas/rotation';
import { calculateRotation } from '@/services/rotation-calculator/rotation-bridge';
import { useRotationStore } from '@/store/useRotationStore';
import { useTeamStore } from '@/store/useTeamStore';

export const useRotationCalculation = () => {
  const team = useTeamStore((state) => state.team);
  const enemy = useTeamStore((state) => state.enemy);
  const attacks = useRotationStore((state) => state.attacks);
  const buffs = useRotationStore((state) => state.buffs);

  return useQuery({
    queryKey: ['rotation-calculation', team, enemy, attacks, buffs],
    queryFn: async () => {
      const CalculationSchema = RotationSchema.refine(
        (data) => {
          const allAttacksHaveParams = data.attacks.every((attack) =>
            (attack.parameters ?? []).every((param) => param.value !== undefined),
          );
          const allBuffsHaveParams = data.buffs.every((buff) =>
            (buff.parameters ?? []).every((param) => param.value !== undefined),
          );
          return allAttacksHaveParams && allBuffsHaveParams;
        },
        {
          message: 'Please populate all parameter values before calculating.',
        },
      ).refine(
        (data) => {
          const allAttacksValid = data.attacks.every((attack) =>
            (attack.parameters ?? []).every((param) => {
              if (param.value === undefined) return true;
              return param.value >= param.minimum && param.value <= param.maximum;
            }),
          );
          const allBuffsValid = data.buffs.every((buff) =>
            (buff.parameters ?? []).every((param) => {
              if (param.value === undefined) return true;
              return param.value >= param.minimum && param.value <= param.maximum;
            }),
          );
          return allAttacksValid && allBuffsValid;
        },
        {
          message:
            'All parameter values must be between their minimum and maximum allowed values.',
        },
      );

      // Validate inputs
      const validationResult = CalculationSchema.safeParse({ attacks, buffs });
      if (!validationResult.success) {
        // Extract the custom error message if available, or join zErr messages
        const errorMessage = validationResult.error.issues
          .map((issue) => issue.message)
          .join(', ');
        throw new Error(errorMessage);
      }

      return calculateRotation(team, enemy, attacks, buffs);
    },
    placeholderData: keepPreviousData,
    enabled: false,
    retry: false,
  });
};
