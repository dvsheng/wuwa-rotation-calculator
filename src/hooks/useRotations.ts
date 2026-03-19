import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListRotationsRequest } from '@/schemas/rotation-library';
import { listRotations } from '@/services/rotation-library';

export interface UseRotationsOptions {
  enabled?: boolean;
}

export const normalizeRotationQuery = (
  input: ListRotationsRequest,
): ListRotationsRequest => ({
  ...input,
  offset: input.offset,
  limit: input.limit,
  characterIds: [...new Set(input.characterIds)]
    .filter((characterId) => characterId > 0)
    .toSorted((left, right) => left - right),
});

export const rotationQueryKeys = {
  all: ['rotations'] as const,
  scope: (scope: ListRotationsRequest['scope']) => ['rotations', scope] as const,
  list: (input: ListRotationsRequest) =>
    ['rotations', input.scope, normalizeRotationQuery(input)] as const,
};

export const useRotations = (
  input: ListRotationsRequest,
  options: UseRotationsOptions = {},
) => {
  const normalizedInput = normalizeRotationQuery(input);
  const query = useQuery({
    queryKey: rotationQueryKeys.list(normalizedInput),
    queryFn: () => listRotations({ data: normalizedInput }),
    placeholderData: normalizedInput.scope === 'public' ? keepPreviousData : undefined,
    retry: false,
    enabled: options.enabled ?? true,
  });

  return {
    ...query,
    data: query.data ?? {
      items: [],
      total: 0,
      offset: normalizedInput.offset,
      limit: normalizedInput.limit,
    },
    isPreviousData: query.isPlaceholderData,
    input: normalizedInput,
  };
};
