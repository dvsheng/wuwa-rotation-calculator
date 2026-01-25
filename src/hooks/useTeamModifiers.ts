import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Buff } from '@/schemas/rotation';
import type { Team } from '@/schemas/team';
import { getCharacterDetails } from '@/services/game-data/character/get-character-details';
import { getEchoDetails } from '@/services/game-data/echo/get-echo-details';
import { getEchoSetDetails } from '@/services/game-data/echo-set/get-echo-set-details';
import { getWeaponDetails } from '@/services/game-data/weapon/get-weapon-details';
import type { RefineLevel } from '@/services/game-data/weapon/types';

const isBuffParameterized = (buff: any): boolean => {
  if (!buff.modifiedStats) return false;
  return Object.values(buff.modifiedStats).some((stats: any) =>
    stats.some(
      (stat: any) =>
        typeof stat.value === 'object' &&
        'parameterConfigs' in stat.value &&
        !('resolveWith' in stat.value),
    ),
  );
};

export const useTeamModifiers = (team: Team) => {
  const queryMetadata = team.flatMap((character) => {
    const items = [
      {
        characterName: character.name,
        queryType: 'character',
        entityName: character.name,
      },
      {
        characterName: character.name,
        queryType: 'weapon',
        entityName: character.weapon.name,
        refine: character.weapon.refine,
      },
      {
        characterName: character.name,
        queryType: 'echo',
        entityName: character.primarySlotEcho.name,
      },
    ];

    character.echoSets.forEach((set) => {
      if (set.name) {
        items.push({
          characterName: character.name,
          queryType: 'echo-set',
          entityName: set.name,
          requirement: set.requirement,
        } as any);
      }
    });

    return items;
  });

  const result = useQueries({
    queries: team.flatMap((character) => {
      const queries: Array<any> = [
        {
          queryKey: ['modifiers', 'character', character.name],
          queryFn: async () =>
            (await getCharacterDetails({ data: character.name })).modifiers,
          enabled: !!character.name,
        },
        {
          queryKey: ['modifiers', 'weapon', character.name, character.weapon.name],
          queryFn: async () => {
            const data = await getWeaponDetails({ data: character.weapon.name });
            const refine = String(character.weapon.refine) as RefineLevel;
            return { name: data.name, modifiers: data.attributes[refine].modifiers };
          },
          enabled: !!character.weapon.name,
        },
        {
          queryKey: [
            'modifiers',
            'echo',
            character.name,
            character.primarySlotEcho.name,
          ],
          queryFn: async () => {
            const data = await getEchoDetails({ data: character.primarySlotEcho.name });
            return { name: data.name, modifiers: data.modifiers };
          },
          enabled: !!character.primarySlotEcho.name,
        },
      ];

      character.echoSets.forEach((set) => {
        if (set.name) {
          queries.push({
            queryKey: [
              'modifiers',
              'echo-set',
              character.name,
              set.name,
              set.requirement,
            ],
            queryFn: async () => {
              const data = await getEchoSetDetails({ data: set.name });
              const effect = data.setEffects[set.requirement];
              return { name: data.name, modifiers: effect?.modifiers || [] };
            },
            enabled: !!set.name,
          });
        }
      });

      return queries;
    }),
    combine: (results) => {
      const buffs = results.flatMap((queryResult, index) => {
        const data = queryResult.data;
        if (!data) return [];

        const { characterName, queryType } = queryMetadata[index];

        const processModifiers = (mods: Array<any>, parentName: string, source: 'character' | 'weapon' | 'echo' | 'echo-set') => {
          return mods.map((mod, i) => ({
            id: `buff-${characterName}-${parentName}-${mod.name}-${i}`,
            entityType: 'buff' as const,
            name: mod.name,
            parentName: mod.parentName || parentName,
            description: mod.description,
            characterName,
            source,
            isParameterized: isBuffParameterized(mod),
          }));
        };

        if (queryType === 'character') {
          return processModifiers(data as Array<any>, characterName, 'character');
        } else {
          const { name, modifiers } = data as { name: string; modifiers: Array<any> };
          return processModifiers(modifiers, name, queryType as any);
        }
      });

      return {
        buffs: buffs as Array<Buff>,
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
