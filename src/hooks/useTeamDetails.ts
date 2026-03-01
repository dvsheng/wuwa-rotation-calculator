import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { ClientAttack, ClientModifier } from '@/services/game-data';
import { EntityType, getClientEntityById } from '@/services/game-data';
import { useStore } from '@/store';

interface ClientCharacterDetails {
  characterId: number;
  characterName: string;
}

export type DetailedAttack = ClientCharacterDetails & ClientAttack;

export type DetailedModifier = ClientCharacterDetails & ClientModifier;

export interface UseTeamDetailsResult {
  attacks: Array<DetailedAttack>;
  buffs: Array<DetailedModifier>;
  hasTuneStrain: boolean;
  isLoading: boolean;
  isError: boolean;
}

export const useTeamDetails = (): UseTeamDetailsResult => {
  const team = useStore((state) => state.team);
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
          getClientEntityById({
            data: {
              id: character.id,
              entityType: EntityType.CHARACTER,
              activatedSequence: character.sequence,
            },
          }),
        enabled: !!character.id,
      },
      {
        queryKey: ['team-details', 'weapon', character.id, character.weapon.id],
        queryFn: () =>
          getClientEntityById({
            data: {
              id: character.weapon.id,
              entityType: EntityType.WEAPON,
              refineLevel: character.weapon.refine,
            },
          }),
        enabled: !!character.weapon.id,
      },
      {
        queryKey: ['team-details', 'echo', character.id, character.primarySlotEcho.id],
        queryFn: () =>
          getClientEntityById({
            data: {
              id: character.primarySlotEcho.id,
              entityType: EntityType.ECHO,
            },
          }),
        enabled: !!character.primarySlotEcho.id,
      },
      ...character.echoSets.map((set) => ({
        queryKey: ['team-details', 'echo-set', character.id, set.id, set.requirement],
        queryFn: () =>
          getClientEntityById({
            data: {
              id: set.id,
              entityType: EntityType.ECHO_SET,
              activatedSetBonus: Number.parseInt(set.requirement),
            },
          }),
        enabled: !!set.id,
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

      const hasTuneStrain = results.some((r) => r.data?.hasTuneStrainDamageBonus);

      return {
        attacks,
        buffs,
        hasTuneStrain,
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
