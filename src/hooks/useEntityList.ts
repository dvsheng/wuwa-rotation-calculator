import { useSuspenseQuery } from '@tanstack/react-query';

import type { ListEntitiesRequest } from '@/schemas/game-data-service';
import { listEntities } from '@/services/game-data';
import type {
  EntityType,
  ListCharactersResponseItem,
  ListEchoSetsResponseItem,
  ListEchoesResponseItem,
  ListWeaponsResponseItem,
} from '@/services/game-data';

type InferredListEntityResponse<T extends ListEntitiesRequest> =
  T['entityType'] extends typeof EntityType.CHARACTER
    ? Array<ListCharactersResponseItem>
    : T['entityType'] extends typeof EntityType.WEAPON
      ? Array<ListWeaponsResponseItem>
      : T['entityType'] extends typeof EntityType.ECHO
        ? Array<ListEchoesResponseItem>
        : T['entityType'] extends typeof EntityType.ECHO_SET
          ? Array<ListEchoSetsResponseItem>
          : never;

export const useEntityList = <T extends ListEntitiesRequest>(request: T) => {
  return useSuspenseQuery({
    queryKey: [request.entityType],
    queryFn: () => listEntities({ data: request }),
    staleTime: Infinity,
    // TODO: Investigate why this server function fails so often.
    retry: 10,
  }) as Omit<ReturnType<typeof useSuspenseQuery>, 'data'> & {
    data: InferredListEntityResponse<T>;
  };
};
