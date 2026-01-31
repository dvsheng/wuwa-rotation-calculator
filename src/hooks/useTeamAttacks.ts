import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { getClientCharacterDetails } from '@/services/game-data/character/get-character-details';
import type { GetClientCharacterDetailsOutput } from '@/services/game-data/character/types';
import { getClientEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getClientWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { useTeamStore } from '@/store/useTeamStore';

export const useTeamAttacks = () => {
  const team = useTeamStore((state) => state.team);
  const queryMetadata = team.flatMap((character) => [
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
  ]);

  const result = useQueries({
    queries: team.flatMap((character) => [
      {
        queryKey: ['attacks', 'character', character.id, character.sequence],
        queryFn: () =>
          getClientCharacterDetails({
            data: { id: character.id, sequence: character.sequence },
          }),
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
      const attacks = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];
        const { characterId } = queryMetadata[index];
        const characterName = characterNameMap.get(characterId) ?? 'Unknown';
        return data.attacks.map((attack) => ({
          ...attack,
          characterId,
          characterName,
        }));
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
