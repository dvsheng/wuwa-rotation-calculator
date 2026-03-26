import { useQueries } from '@tanstack/react-query';
import { compact } from 'es-toolkit';

import type { Capability } from '@/services/game-data';
import {
  CapabilityType,
  isResolvedUserParameterizedNumber,
} from '@/services/game-data';
import type {
  CapabilityResolverOptions,
  ResolvedCapability,
} from '@/services/game-data/list-entity-capabilities.function';
import {
  filterAndResolveCapabilities,
  listEntityCapabilities,
} from '@/services/game-data/list-entity-capabilities.function';
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

const LIST_ENTITY_CAPABILITIES_RETRY_COUNT = 10;

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
  const result = useQueries({
    queries: team.flatMap((character) => [
      getQueryOptions(character.id, {
        characterId: character.id,
        resolveConfig: { sequence: character.sequence },
      }),
      getQueryOptions(character.weapon.id, {
        characterId: character.id,
        resolveConfig: { refineLevel: character.weapon.refine },
      }),
      getQueryOptions(character.primarySlotEcho.id, {
        characterId: character.id,
        resolveConfig: {},
      }),
      ...character.echoSets.map((set) =>
        getQueryOptions(set.id, {
          characterId: character.id,
          resolveConfig: {
            activatedSetBonus: Number.parseInt(set.requirement) as 2 | 3 | 5,
          },
        }),
      ),
    ]),
    combine: (results) => {
      const allCapabilities = results.flatMap((queryResult) => {
        const queryCapabilities = queryResult.data;
        if (!queryCapabilities) return [];
        const enrichedCapabilities = compact(
          queryCapabilities.map((capability) => {
            const character = entities.find(
              (entity) => entity.id === capability.characterId,
            );
            if (!character) return;
            return {
              ...capability,
              characterName: character.name,
              characterIconUrl: character.iconUrl,
            };
          }),
        );
        return enrichedCapabilities;
      });
      return {
        capabilities: allCapabilities,
        isLoading: results.some((queryResult) => queryResult.isLoading),
        isError: results.every((queryResult) => queryResult.isError),
      };
    },
  });
  return result;
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

const getQueryOptions = (
  entityId: number,
  metadata: { characterId: number; resolveConfig: CapabilityResolverOptions },
) => {
  return {
    queryKey: ['entity', entityId],
    queryFn: () => listEntityCapabilities({ data: { id: entityId } }),
    staleTime: Infinity,
    retry: LIST_ENTITY_CAPABILITIES_RETRY_COUNT,
    select: (data: Array<Capability>) => {
      return filterAndResolveCapabilities(data, metadata.resolveConfig).map(
        (capability) => ({
          ...capability,
          entityId,
          characterId: metadata.characterId,
          parameters: extractUserParameters(capability),
        }),
      );
    },
  };
};
