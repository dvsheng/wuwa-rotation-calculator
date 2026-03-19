import { useSuspenseQuery } from '@tanstack/react-query';

import type { ListRotationsRequest } from '@/schemas/rotation-library';
import { listRotations } from '@/services/rotation-library';

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

export const useRotations = (input: ListRotationsRequest) => {
  const normalizedInput = normalizeRotationQuery(input);
  const query = useSuspenseQuery({
    queryKey: rotationQueryKeys.list(normalizedInput),
    queryFn: () => listRotations({ data: normalizedInput }),
    retry: false,
  });

  return {
    ...query,
    isPreviousData: false,
    input: normalizedInput,
  };
};
