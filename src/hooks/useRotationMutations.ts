import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SavedRotationData } from '@/schemas/library';
import {
  createRotation as createRotationRequest,
  deleteRotation as deleteRotationRequest,
  updateRotation as updateRotationRequest,
} from '@/services/rotation-library';

import { rotationQueryKeys } from './useRotations';

interface CreateRotationInput {
  name: string;
  description?: string;
  totalDamage?: number;
  data: SavedRotationData;
}

interface UpdateRotationInput {
  id: number;
  name?: string;
  description?: string;
  totalDamage?: number;
  visibility?: 'private' | 'public';
  data?: SavedRotationData;
}

interface DeleteRotationInput {
  id: number;
}

export const useRotationMutations = () => {
  const queryClient = useQueryClient();

  const invalidateOwned = () =>
    queryClient.invalidateQueries({
      queryKey: rotationQueryKeys.scope('owned'),
    });
  const invalidatePublic = () =>
    queryClient.invalidateQueries({
      queryKey: rotationQueryKeys.scope('public'),
    });

  const createMutation = useMutation({
    mutationFn: (input: CreateRotationInput) => createRotationRequest({ data: input }),
    onSuccess: async () => {
      await invalidateOwned();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRotationInput) => updateRotationRequest({ data: input }),
    onSuccess: async (rotation, input) => {
      await invalidateOwned();

      if (rotation.visibility === 'public' || input.visibility !== undefined) {
        await invalidatePublic();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteRotationInput) => deleteRotationRequest({ data: input }),
    onSuccess: async () => {
      await Promise.all([invalidateOwned(), invalidatePublic()]);
    },
  });

  return {
    createRotation: createMutation.mutateAsync,
    updateRotation: updateMutation.mutateAsync,
    deleteRotation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
