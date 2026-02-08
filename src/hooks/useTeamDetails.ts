import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { ClientAttack, ClientModifier } from '@/services/game-data/common-types';
import { getClientEntityByHakushinId } from '@/services/game-data/get-entity-details.function';
import { useTeamStore } from '@/store/useTeamStore';

interface ClientCharacterDetails {
  characterId: number;
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
          getClientEntityByHakushinId({
            data: {
              id: character.id,
              entityType: 'character',
              activatedSequence: character.sequence,
            },
          }),
        enabled: !!character.id,
        staleTime: Infinity,
      },
      {
        queryKey: ['team-details', 'weapon', character.id, character.weapon.id],
        queryFn: () =>
          getClientEntityByHakushinId({
            data: {
              id: character.weapon.id,
              entityType: 'weapon',
              refineLevel: character.weapon.refine,
            },
          }),
        enabled: !!character.weapon.id,
        staleTime: Infinity,
      },
      {
        queryKey: ['team-details', 'echo', character.id, character.primarySlotEcho.id],
        queryFn: () =>
          getClientEntityByHakushinId({
            data: {
              id: character.primarySlotEcho.id,
              entityType: 'echo',
            },
          }),
        enabled: !!character.primarySlotEcho.id,
        staleTime: Infinity,
      },
      ...character.echoSets.map((set) => ({
        queryKey: ['team-details', 'echo-set', character.id, set.id, set.requirement],
        queryFn: () =>
          getClientEntityByHakushinId({
            data: {
              id: set.id,
              entityType: 'echo_set',
              activatedSetBonus: Number.parseInt(set.requirement),
            },
          }),
        enabled: !!set.id,
        staleTime: Infinity,
      })),
    ]),
    combine: (results) => {
      const characterNameMap = new Map<number, string>();
      for (const [index, characterResult] of results.entries()) {
        const meta = queryMetadata[index];
        if (meta.queryType !== 'character') continue;
        if (!characterResult.data) continue;
        characterNameMap.set(meta.characterId, characterResult.data.name);
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
