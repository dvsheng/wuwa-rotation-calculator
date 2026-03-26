import { useQuery } from '@tanstack/react-query';
import { keyBy } from 'es-toolkit';

import {
  CapabilityType,
  isResolvedUserParameterizedNumber,
} from '@/services/game-data';
import type { ResolvedCapability } from '@/services/game-data/list-capabilities.function';
import { listOwnedCapabilitiesForTeam } from '@/services/game-data/list-owned-team-capabilities';
import { useStore } from '@/store';

import { useEntities } from './useEntities';

/**
 * Interfaces for client-facing entity details outputs.
 */
export interface Parameter {
  id: string;
  minimum: number;
  maximum: number;
}

export type UseTeamDetailsResult = {
  capabilities: Array<
    ResolvedCapability & {
      parameters: Array<Parameter>;
      characterId: number;
      characterName: string;
      characterIconUrl?: string;
      entityId: number;
    }
  >;
  isLoading: boolean;
  isError: boolean;
};

export type CharacterCapability = UseTeamDetailsResult['capabilities'][number];

export type CharacterAttack = Extract<
  CharacterCapability,
  { capabilityJson: { type: typeof CapabilityType.ATTACK } }
>;

export type CharacterModifier = Extract<
  CharacterCapability,
  { capabilityJson: { type: typeof CapabilityType.MODIFIER } }
>;

const LIST_CAPABILITIES_RETRY_COUNT = 10;

export const isDetailedAttack = (
  capability: CharacterCapability,
): capability is CharacterAttack =>
  capability.capabilityJson.type === CapabilityType.ATTACK;

export const isDetailedModifier = (
  capability: CharacterCapability,
): capability is CharacterModifier =>
  capability.capabilityJson.type === CapabilityType.MODIFIER;

export const useTeamDetails = (): UseTeamDetailsResult => {
  const team = useStore((state) => state.team);
  const { data: entities } = useEntities({});
  const characterDetailsById = keyBy(entities, (entity) => entity.id);
  const query = useQuery({
    queryKey: ['team-details', team],
    queryFn: () =>
      listOwnedCapabilitiesForTeam(team, (character) => ({
        characterId: character.id,
      })),
    enabled: team.length > 0,
    staleTime: Infinity,
    retry: LIST_CAPABILITIES_RETRY_COUNT,
    select: (data) =>
      data.map((capability) => {
        const character = characterDetailsById[capability.characterId];

        return {
          ...capability,
          characterName: character.name,
          characterIconUrl: character.iconUrl,
          parameters: extractUserParameters(capability),
        };
      }),
  });
  return {
    capabilities: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

const extractUserParameters = (capability: ResolvedCapability): Array<Parameter> => {
  const parameters = new Map<string, Parameter>();
  const visit = (value: unknown) => {
    if (isResolvedUserParameterizedNumber(value)) {
      parameters.set(value.parameterId, {
        id: value.parameterId,
        minimum: value.minimum ?? 0,
        maximum: value.maximum ?? 100,
      });
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value === 'object' && value !== null) {
      for (const nestedValue of Object.values(value)) visit(nestedValue);
    }
  };
  visit(capability.capabilityJson);
  return [...parameters.values()];
};
