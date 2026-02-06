import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { getClientCharacterDetails } from '@/services/game-data/character/get-character-details';
import type { GetClientCharacterDetailsOutput } from '@/services/game-data/character/types';
import type { ClientAttack, ClientModifier } from '@/services/game-data/common-types';
import { getClientEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getClientEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';
import { getClientWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import { useTeamStore } from '@/store/useTeamStore';

interface ClientCharacterDetails {
  characterId: string;
  characterName: string;
}

export type DetailedAttack = ClientCharacterDetails & ClientAttack;

export type DetailedModifier = ClientCharacterDetails & ClientModifier;

export interface UseTeamDetailsResult {
  attacks: Array<DetailedAttack>;
  buffs: Array<DetailedModifier>;
  isLoading: boolean;
  isError: boolean;
}

export const useTeamDetails = (): UseTeamDetailsResult => {
  const team = useTeamStore((state) => state.team);
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

    for (const set of character.echoSets) {
      if (set.id) {
        items.push({
          characterId: character.id,
          queryType: 'echo-set',
        });
      }
    }

    return items;
  });

  const result = useQueries({
    queries: team.flatMap((character) => [
      {
        queryKey: ['team-details', 'character', character.id, character.sequence],
        queryFn: () =>
          getClientCharacterDetails({
            data: { id: character.id, sequence: character.sequence },
          }),
        enabled: !!character.id,
        staleTime: Infinity,
      },
      {
        queryKey: ['team-details', 'weapon', character.id, character.weapon.id],
        queryFn: () =>
          getClientWeaponDetails({
            data: {
              id: character.weapon.id,
              refineLevel: String(character.weapon.refine) as any,
            },
          }),
        enabled: !!character.weapon.id,
        staleTime: Infinity,
      },
      {
        queryKey: ['team-details', 'echo', character.id, character.primarySlotEcho.id],
        queryFn: () => getClientEchoDetails({ data: character.primarySlotEcho.id }),
        enabled: !!character.primarySlotEcho.id,
        staleTime: Infinity,
      },
      ...character.echoSets.map((set) => ({
        queryKey: ['team-details', 'echo-set', character.id, set.id, set.requirement],
        queryFn: () =>
          getClientEchoSetDetails({
            data: { id: set.id, requirement: set.requirement as any },
          }),
        enabled: !!set.id,
        staleTime: Infinity,
      })),
    ]),
    combine: (results) => {
      const characterNameMap = new Map<string, string>();
      for (const [index, characterResult] of results.entries()) {
        const meta = queryMetadata[index];
        if (meta.queryType !== 'character') continue;
        if (!characterResult.data) continue;
        characterNameMap.set(
          meta.characterId,
          (characterResult.data as unknown as GetClientCharacterDetailsOutput).name,
        );
      }

      const attacks = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data || !('attacks' in data)) return [];

        const { characterId } = queryMetadata[index];
        const characterName = characterNameMap.get(characterId) ?? 'Unknown';

        return data.attacks.map((attack) => ({
          ...attack,
          characterId,
          characterName,
        }));
      });

      const buffs = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data || !('modifiers' in data)) return [];

        const { characterId } = queryMetadata[index];
        const characterName = characterNameMap.get(characterId) ?? 'Unknown';

        return data.modifiers.map((modifier) => ({
          ...modifier,
          characterId,
          characterName,
        }));
      });

      return {
        attacks,
        buffs,
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
      };
    },
  });

  useEffect(() => {
    if (!result.isError) return;
    toast.error('Failed to load some team details');
  }, [result.isError]);

  return result;
};
