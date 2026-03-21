import { useSuspenseQuery } from '@tanstack/react-query';

import type { ListRotationsRequest } from '@/schemas/rotation-library';
import { listRotations } from '@/services/rotation-library';

export const useRotations = (input: ListRotationsRequest) => {
  return useSuspenseQuery({
    queryKey: ['rotations', input.scope, input],
    queryFn: () => listRotations({ data: input }),
  });
};
