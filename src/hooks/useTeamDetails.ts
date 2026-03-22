import { useQueries } from '@tanstack/react-query';

import type {
  ClientAttack,
  ClientModifier,
  GetClientEntityDetailsResponse,
} from '@/services/game-data';
import { EntityType, Target, getClientEntityById } from '@/services/game-data';
import { useStore } from '@/store';

interface ClientCharacterDetails {
  characterId: number;
  entityId: number;
  characterName: string;
  characterIconUrl?: string;
}

export type DetailedAttack = ClientCharacterDetails & ClientAttack;

export type DetailedModifier = ClientCharacterDetails & ClientModifier;

export type UseTeamDetailsResult = ReturnType<typeof useTeamDetails>;

const TARGET_ORDERING = [
  Target.TEAM,
  Target.ENEMY,
  Target.ACTIVE_CHARACTER,
  Target.SELF,
];

export const useTeamDetails = () => {
  const team = useStore((state) => state.team);
  const queryMetadata = team.flatMap((character) => {
    return [
      {
        characterId: character.id,
        entityId: character.id,
        queryType: 'character',
      },
      {
        characterId: character.id,
        entityId: character.weapon.id,
        queryType: 'weapon',
      },
      {
        characterId: character.id,
        entityId: character.primarySlotEcho.id,
        queryType: 'echo',
      },
      ...character.echoSets.map((set) => ({
        characterId: character.id,
        entityId: set.id,
        queryType: 'echo-set',
        requirement: set.requirement,
      })),
    ];
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
        staleTime: Infinity,
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
        staleTime: Infinity,
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
        staleTime: Infinity,
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
        staleTime: Infinity,
      })),
    ]),
    combine: (results) => {
      const characterMap = new Map<number, GetClientEntityDetailsResponse>();
      for (const [index, characterResult] of results.entries()) {
        const meta = queryMetadata[index];
        if (meta.queryType !== 'character') continue;
        if (!characterResult.data) continue;
        characterMap.set(meta.characterId, characterResult.data);
      }

      const attacks = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterId, entityId } = queryMetadata[index];
        const character = characterMap.get(characterId);
        return data.attacks.map((attack) => ({
          ...attack,
          entityId,
          characterId,
          characterName: character?.name ?? '',
          characterIconUrl: character?.iconUrl,
        }));
      });

      const buffs = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterId, entityId } = queryMetadata[index];
        const character = characterMap.get(characterId);
        return data.modifiers.map((modifier) => {
          const target = modifier.modifiedStats
            .map((stat) => stat.target)
            .toSorted(
              (a, b) => TARGET_ORDERING.indexOf(a) - TARGET_ORDERING.indexOf(b),
            )[0];
          const modifierWithTarget = { ...modifier, target };
          return {
            ...modifierWithTarget,
            entityId,
            characterId,
            characterName: character?.name ?? '',
            characterIconUrl: character?.iconUrl,
          };
        });
      });

      return {
        attacks,
        buffs,
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
      };
    },
  });
  return result;
};
