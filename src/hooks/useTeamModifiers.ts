import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Team } from '@/schemas/team';
import { getClientCharacterDetails } from '@/services/game-data/character/get-character-details';
import { getClientEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getClientEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';
import { getClientWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';

export const useTeamModifiers = (team: Team) => {
  const queryMetadata = team.flatMap((character) => {
    const items = [
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
    ];

    character.echoSets.forEach((set) => {
      if (set.id) {
        items.push({
          characterId: character.id,
          characterName: character.name,
          queryType: 'echo-set',
        } as any);
      }
    });

    return items;
  });

  const result = useQueries({
    queries: team.flatMap((character) => [
      {
        queryKey: ['modifiers', 'character', character.id, character.sequence],
        queryFn: () =>
          getClientCharacterDetails({
            data: { id: character.id, sequence: character.sequence },
          }),
        enabled: !!character.id,
      },
      {
        queryKey: ['modifiers', 'weapon', character.id, character.weapon.id],
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
        queryKey: ['modifiers', 'echo', character.id, character.primarySlotEcho.id],
        queryFn: () => getClientEchoDetails({ data: character.primarySlotEcho.id }),
        enabled: !!character.primarySlotEcho.id,
      },
      ...character.echoSets.map((set) => ({
        queryKey: ['modifiers', 'echo-set', character.id, set.id, set.requirement],
        queryFn: () =>
          getClientEchoSetDetails({
            data: { id: set.id, requirement: set.requirement as any },
          }),
        enabled: !!set.id,
      })),
    ]),
    combine: (results) => {
      const buffs = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterId, characterName } = queryMetadata[index];

        return (data as any).modifiers.map((modifier: any, i: number) => ({
          ...modifier,
          id: `buff-${characterName}-${modifier.name}-${i}`,
          characterId,
          characterName,
        }));
      });

      return {
        buffs,
        isLoading: results.some((res) => res.isLoading),
        isError: results.some((res) => res.isError),
      };
    },
  });

  useEffect(() => {
    if (!result.isError) return;
    toast.error('Failed to load some modifiers');
  }, [result.isError]);

  return result;
};
