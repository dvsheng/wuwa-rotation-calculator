import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Team } from '@/schemas/team';
import { getClientCharacterDetails } from '@/services/game-data/character/get-character-details';
import { getClientEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getClientWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';

export const useTeamAttacks = (team: Team) => {
  const queryMetadata = team.flatMap((character) => [
    {
      characterId: character.id,
      characterName: character.name,
      queryType: 'character',
    },
    {
      characterId: character.id,
      characterName: character.name,
      queryType: 'weapon',
    },
    {
      characterId: character.id,
      characterName: character.name,
      queryType: 'echo',
    },
  ]);

  const result = useQueries({
    queries: team.flatMap((character) => [
      {
        queryKey: ['attacks', 'character', character.id],
        queryFn: () => getClientCharacterDetails({ data: character.id }),
        enabled: !!character.id,
      },
      {
        queryKey: ['attacks', 'weapon', character.id, character.weapon.id],
        queryFn: () =>
          getClientWeaponDetails({
            data: {
              id: character.weapon.id,
              refineLevel: String(character.weapon.refine) as any,
            },
          }),
        enabled: !!character.weapon.id,
      },
      {
        queryKey: ['attacks', 'echo', character.id, character.primarySlotEcho.id],
        queryFn: () => getClientEchoDetails({ data: character.primarySlotEcho.id }),
        enabled: !!character.primarySlotEcho.id,
      },
    ]),
    combine: (results) => {
      const attacks = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterId, characterName, queryType } = queryMetadata[index];

        if (queryType === 'character') {
          return (data as any).attacks.map((attack: any) => ({
            ...attack,
            id: `${characterName}-${attack.name}`,
            characterId,
            characterName,
          }));
        } else {
          const attack = (data as any).attack;
          if (!attack) return [];
          return [
            {
              ...attack,
              id: `${characterName}-${queryType}-attack`,
              characterId,
              characterName,
            },
          ];
        }
      });

      return {
        attacks,
        isLoading: results.some((res) => res.isLoading),
        isError: results.some((res) => res.isError),
        rawResults: results,
      };
    },
  });

  useEffect(() => {
    if (!result.isError) return;
    toast.error('Failed to load some attacks');
  }, [result.isError]);

  return result;
};
