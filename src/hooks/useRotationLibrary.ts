import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import type { SavedRotationData } from '@/schemas/library';
import {
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
  const queryKey = ['rotation-library'] as const;

  const rotationsQuery = useSuspenseQuery({
    queryKey,
    queryFn: () => listRotations(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRotationInput) => createRotationRequest({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRotationInput) => updateRotationRequest({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteRotationInput) => deleteRotationRequest({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    rotations: rotationsQuery.data,
    createRotation: createMutation.mutateAsync,
    updateRotation: updateMutation.mutateAsync,
    deleteRotation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
