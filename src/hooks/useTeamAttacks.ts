import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Team } from '@/schemas/team';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import type { CharacterAttack } from '@/services/game-data/character/types';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';

export const useTeamAttacks = (team: Team) => {
  const queryMetadata = team.flatMap((character) => [
    {
      characterName: character.name,
      queryType: 'character',
      entityName: character.name,
    },
    {
      characterName: character.name,
      queryType: 'weapon',
      entityName: character.weapon.name,
    },
    {
      characterName: character.name,
      queryType: 'echo',
      entityName: character.primarySlotEcho.name,
    },
  ]);

  const result = useQueries({
    queries: team.flatMap((character) => [
      {
        queryKey: ['attacks', 'character', character.name],
        queryFn: async () =>
          (await getCharacterDetails({ data: character.name })).attacks,
        enabled: !!character.name,
      },
      {
        queryKey: ['attacks', 'weapon', character.name, character.weapon.name],
        queryFn: async () => {
          const data = await getWeaponDetails({ data: character.weapon.name });
          const attack = data.attributes[1].attack;
          return attack ? [attack] : [];
        },
        enabled: !!character.weapon.name,
      },
      {
        queryKey: ['attacks', 'echo', character.name, character.primarySlotEcho.name],
        queryFn: async () => {
          const data = await getEchoDetails({ data: character.primarySlotEcho.name });
          return data.attack ? [data.attack] : [];
        },
        enabled: !!character.primarySlotEcho.name,
      },
    ]),
    combine: (results) => {
      const attacks = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterName, queryType, entityName } = queryMetadata[index];

        switch (queryType) {
          case 'character':
            return (data as Array<CharacterAttack>).map((attack) => ({
              id: `${characterName}-${attack.name}`,
              name: attack.name,
              parentName: attack.parentName,
              description: attack.description,
              characterName,
            }));
          case 'weapon':
            return (data as Array<any>).map((attack) => ({
              id: `${characterName}-weapon-${entityName}`,
              name: 'Weapon Skill',
              parentName: entityName,
              description: attack.description,
              characterName,
            }));
          case 'echo':
            return (data as Array<any>).map((attack) => ({
              id: `${characterName}-echo-${entityName}`,
              name: 'Echo Skill',
              parentName: entityName,
              description: attack.description,
              characterName,
            }));
          default:
            return [];
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
