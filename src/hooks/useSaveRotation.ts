import { toast } from 'sonner';

import { useStore } from '@/store';

import { useRotationCalculation } from './useRotationCalculation';
import { useRotationMutations } from './useRotationMutations';

interface SaveRotationInput {
  name?: string;
  description?: string;
  rotationId?: number;
}

export const useSaveRotation = () => {
  const { data, isStale, refetch, isRefetching } = useRotationCalculation();
  const { createRotation, updateRotation, isCreating, isUpdating } =
    useRotationMutations();
  const team = useStore((state) => state.team);
  const enemy = useStore((state) => state.enemy);
  const attacks = useStore((state) => state.attacks);
  const buffs = useStore((state) => state.buffs);

  const saveRotation = async ({ name, description, rotationId }: SaveRotationInput) => {
    const trimmedName = name?.trim();
    if (!trimmedName && !rotationId) {
      const error = new Error('Rotation name or id is required.');
      toast.error('Please enter a name for the rotation.');
      throw error;
    }
    if (isCreating || isUpdating || isRefetching) {
      return;
    }

    const isUpdatingExisting = rotationId !== undefined;
    const loadingMessage = isUpdatingExisting
      ? 'Updating rotation...'
      : 'Saving rotation...';
    const successMessage = isUpdatingExisting
      ? trimmedName
        ? `Updated rotation: ${trimmedName}`
        : 'Rotation updated successfully!'
      : 'Rotation saved successfully!';
    const failureMessage = isUpdatingExisting
      ? 'Failed to update rotation.'
      : 'Failed to save rotation.';
    const toastId = toast.loading(loadingMessage);

    try {
      let totalDamage = data?.totalDamage;

      if (!data || isStale) {
        try {
          const refreshedResult = await refetch();

          if (refreshedResult.error) {
            throw refreshedResult.error;
          }

          totalDamage = refreshedResult.data?.totalDamage;
        } catch {
          // Calculation is best-effort; save without total damage if it fails.
        }
      }

      const trimmedDescription = description?.trim() || undefined;
      const rotationData = {
        team,
        enemy,
        attacks,
        buffs,
      };

      if (rotationId) {
        await updateRotation({
          id: rotationId,
          name: trimmedName,
          description: trimmedDescription,
          data: rotationData,
          totalDamage,
        });
      } else {
        if (!trimmedName) {
          throw new Error('Rotation name is required when creating a rotation.');
        }

        await createRotation({
          name: trimmedName,
          description: trimmedDescription,
          data: rotationData,
          totalDamage,
        });
      }

      toast.success(successMessage, {
        id: toastId,
      });
    } catch (error) {
      toast.error(failureMessage, {
        id: toastId,
      });
      throw error;
    }
  };

  return {
    saveRotation,
    isSaving: isCreating || isUpdating || isRefetching,
  };
};
