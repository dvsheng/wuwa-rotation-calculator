import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import type {
  CreateCapabilityRequest,
  DeleteCapabilityRequest,
  UpdateCapabilityRequest,
} from '@/schemas/admin';
import {
  createCapability as createCapabilityRequest,
  deleteCapability as deleteCapabilityRequest,
  updateCapability as updateCapabilityRequest,
} from '@/services/admin';
import { listCapabilities } from '@/services/game-data/list-capabilities.function';

const capabilityQueryKeys = {
  all: () => ['entity-capabilities'] as const,
  entity: (entityIds: Array<number>) =>
    [...capabilityQueryKeys.all(), entityIds.toSorted()] as const,
};

export const useEntityCapabilities = (entityIds: Array<number>) => {
  return useSuspenseQuery({
    queryKey: capabilityQueryKeys.entity(entityIds),
    queryFn: () => listCapabilities({ data: { entityIds } }),
    staleTime: Infinity,
  });
};

export const useCapabilityActions = (entityId: number) => {
  const queryClient = useQueryClient();

  const invalidateCapabilities = () =>
    queryClient.invalidateQueries({
      queryKey: capabilityQueryKeys.entity([entityId]),
    });

  const createMutation = useMutation({
    mutationFn: (input: CreateCapabilityRequest) =>
      createCapabilityRequest({ data: input }),
    onSuccess: async () => {
      await invalidateCapabilities();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateCapabilityRequest) =>
      updateCapabilityRequest({ data: input }),
    onSuccess: async () => {
      await invalidateCapabilities();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteCapabilityRequest) =>
      deleteCapabilityRequest({ data: input }),
    onSuccess: async () => {
      await invalidateCapabilities();
    },
  });

  return {
    createCapability: createMutation.mutateAsync,
    updateCapability: updateMutation.mutateAsync,
    deleteCapability: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
