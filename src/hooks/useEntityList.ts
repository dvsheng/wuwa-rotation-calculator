import { useSuspenseQuery } from '@tanstack/react-query';

import type { ListEntitiesRequest } from '@/schemas/game-data-service';
import { EntityType, listEntities } from '@/services/game-data';
import type {
  ListCharactersResponseItem,
  ListEchoSetsResponseItem,
  ListEchoesResponseItem,
  ListEntitiesResponse,
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
  const query = useSuspenseQuery({
    queryKey: ['entity'],
    queryFn: () => listEntities(),
    staleTime: Infinity,
    retry: 10,
  }) as Omit<ReturnType<typeof useSuspenseQuery>, 'data'> & {
    data: ListEntitiesResponse;
  };

  const data = (() => {
    switch (request.entityType) {
      case EntityType.CHARACTER: {
        return request.weaponType
          ? query.data.characters.filter(
              (character) => character.weaponType === request.weaponType,
            )
          : query.data.characters;
      }
      case EntityType.WEAPON: {
        return request.weaponType
          ? query.data.weapons.filter(
              (weapon) => weapon.weaponType === request.weaponType,
            )
          : query.data.weapons;
      }
      case EntityType.ECHO: {
        return query.data.echoes;
      }
      case EntityType.ECHO_SET: {
        return query.data.echoSets;
      }
    }
  })();

  return { ...query, data } as Omit<ReturnType<typeof useSuspenseQuery>, 'data'> & {
    data: InferredListEntityResponse<T>;
  };
};
