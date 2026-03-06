import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SavedRotationData } from '@/schemas/library';
import {
  ROTATION_OWNER_ID,
  createRotation as createRotationRequest,
  deleteRotation as deleteRotationRequest,
  listRotations,
  updateRotation as updateRotationRequest,
} from '@/services/rotation-library';

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
  data?: SavedRotationData;
}

interface DeleteRotationInput {
  id: number;
}

export const useRotationLibrary = () => {
  const queryClient = useQueryClient();
  const queryKey = ['rotation-library', ROTATION_OWNER_ID] as const;

  const rotationsQuery = useQuery({
    queryKey,
    queryFn: () => listRotations({ data: { ownerId: ROTATION_OWNER_ID } }),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRotationInput) =>
      createRotationRequest({
        data: {
          ownerId: ROTATION_OWNER_ID,
          ...input,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRotationInput) =>
      updateRotationRequest({
        data: {
          ownerId: ROTATION_OWNER_ID,
          ...input,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteRotationInput) =>
      deleteRotationRequest({
        data: {
          ownerId: ROTATION_OWNER_ID,
          ...input,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    rotations: rotationsQuery.data ?? [],
    isLoading: rotationsQuery.isLoading,
    error: rotationsQuery.error,
    createRotation: createMutation.mutateAsync,
    updateRotation: updateMutation.mutateAsync,
    deleteRotation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
