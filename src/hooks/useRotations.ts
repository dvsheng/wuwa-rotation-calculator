import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import type {
  CreateRotationRequest,
  DeleteRotationRequest,
  ListRotationsRequest,
  UpdateRotationRequest,
} from '@/schemas/rotation-library';
import {
  createRotation as createRotationRequest,
  deleteRotation as deleteRotationRequest,
  listRotations,
  updateRotation as updateRotationRequest,
} from '@/services/rotation-library';

const rotationQueryKeys = {
  all: () => ['rotations'] as const,
  scope: (scope: ListRotationsRequest['scope']) =>
    [...rotationQueryKeys.all(), scope] as const,
  list: (input: ListRotationsRequest) =>
    [...rotationQueryKeys.scope(input.scope), input] as const,
};

export const useRotations = (input: ListRotationsRequest) => {
  return useSuspenseQuery({
    queryKey: rotationQueryKeys.list(input),
    queryFn: () => listRotations({ data: input }),
  });
};

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
    mutationFn: (input: CreateRotationRequest) =>
      createRotationRequest({ data: input }),
    onSuccess: async () => {
      await invalidateOwned();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRotationRequest) =>
      updateRotationRequest({ data: input }),
    onSuccess: async (rotation, input) => {
      await invalidateOwned();

      if (rotation.visibility === 'public' || input.visibility !== undefined) {
        await invalidatePublic();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteRotationRequest) =>
      deleteRotationRequest({ data: input }),
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
