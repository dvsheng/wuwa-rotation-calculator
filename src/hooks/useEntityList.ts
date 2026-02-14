import { useSuspenseQuery } from '@tanstack/react-query';

import type { EntityType } from '@/db/schema';
import type { ListEntitiesRequest } from '@/schemas/game-data-service';
import { listEntities } from '@/services/game-data/list-entities.function';
import type {
  EchoSetResponseItem,
  ListCharactersResponseItem,
  ListEchoesResponseItem,
  ListWeaponsResponseItem,
} from '@/services/game-data/list-entities.server';

type InferredListEntityResponse<T extends ListEntitiesRequest> =
  T['entityType'] extends typeof EntityType.CHARACTER
    ? Array<ListCharactersResponseItem>
    : T['entityType'] extends typeof EntityType.WEAPON
      ? Array<ListWeaponsResponseItem>
      : T['entityType'] extends typeof EntityType.ECHO
        ? Array<ListEchoesResponseItem>
        : T['entityType'] extends typeof EntityType.ECHO_SET
          ? Array<EchoSetResponseItem>
          : never;

export const useEntityList = <T extends ListEntitiesRequest>(request: T) => {
  return useSuspenseQuery({
    queryKey: [
      request.entityType,
      'weaponType' in request ? request.weaponType : undefined,
    ],
    queryFn: () => listEntities({ data: request }),
  }) as Omit<ReturnType<typeof useSuspenseQuery>, 'data'> & {
    data: InferredListEntityResponse<T>;
  };
};
