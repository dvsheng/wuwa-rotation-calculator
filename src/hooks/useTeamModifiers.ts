import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Team } from '@/schemas/team';
import { getClientCharacterDetails } from '@/services/game-data/character/get-character-details';
import type { GetClientCharacterDetailsOutput } from '@/services/game-data/character/types';
import { getClientEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getClientEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';
import { getClientWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';

export const useTeamModifiers = (team: Team) => {
  const queryMetadata = team.flatMap((character) => {
    const items = [
      {
        characterId: character.id,
        queryType: 'character',
      },
      {
        characterId: character.id,
        queryType: 'weapon',
      },
      {
        characterId: character.id,
        queryType: 'echo',
      },
    ];

    character.echoSets.forEach((set) => {
      if (set.id) {
        items.push({
          characterId: character.id,
          queryType: 'echo-set',
        });
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
      const characterNameMap = new Map<string, string>();
      results.forEach((characterResult, index) => {
        const meta = queryMetadata[index];
        if (meta.queryType !== 'character') return;
        if (!characterResult.data) return;
        characterNameMap.set(
          meta.characterId,
          (characterResult.data as unknown as GetClientCharacterDetailsOutput).name,
        );
      });
      const buffs = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterId } = queryMetadata[index];
        const characterName = characterNameMap.get(characterId) ?? 'Unknown';

        return data.modifiers.map((modifier) => ({
          ...modifier,
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
