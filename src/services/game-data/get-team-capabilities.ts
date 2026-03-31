import type { Team } from '@/schemas/team';

import { filterAndResolveCapabilities } from './list-capabilities.function';
import type { ResolvedCapability } from './list-capabilities.function';
import type { EntityListRow } from './list-entities.function';
import type { Capability, CapabilityType } from './types';
import {
  isAttack,
  isModifier,
  isPermanentStat,
  isResolvedUserParameterizedNumber,
} from './types';

export interface TeamCapabilities {
  attacks: Array<CharacterAttack>;
  modifiers: Array<CharacterModifier>;
  permanentStats: Array<CharacterPermanentStat>;
}

export interface Parameter {
  id: string;
  minimum: number;
  maximum: number;
}

export type CharacterCapability = ResolvedCapability & {
  parameters: Array<Parameter>;
  characterId: number;
  characterIndex: number;
  characterName: string;
  characterIconUrl?: string;
};

export type CharacterAttack = Extract<
  CharacterCapability,
  { capabilityJson: { type: typeof CapabilityType.ATTACK } }
>;

export type CharacterModifier = Extract<
  CharacterCapability,
  { capabilityJson: { type: typeof CapabilityType.MODIFIER } }
>;

export type CharacterPermanentStat = Extract<
  CharacterCapability,
  { capabilityJson: { type: typeof CapabilityType.PERMANENT_STAT } }
>;

export const getTeamCapabilities = (
  team: Team,
  capabilities: Array<Capability>,
  entities: Array<EntityListRow>,
): TeamCapabilities => {
  const capabilitiesByEntity = Object.groupBy(
    capabilities,
    (capability) => capability.entityId,
  );
  const fullCapabilities = team.flatMap((character, index) => {
    const characterDetails = entities.find((entity) => entity.id === character.id);
    const characterCapabilities = filterAndResolveCapabilities(
      capabilitiesByEntity[character.id] ?? [],
      { sequence: character.sequence },
    );
    const weaponCapabilities = filterAndResolveCapabilities(
      capabilitiesByEntity[character.weapon.id] ?? [],
      { refineLevel: character.weapon.refine },
    );
    const echoCapabilities = filterAndResolveCapabilities(
      capabilitiesByEntity[character.primarySlotEcho.id] ?? [],
      {},
    );
    const echoSetCapabilities = character.echoSets.flatMap((set) =>
      filterAndResolveCapabilities(capabilitiesByEntity[set.id] ?? [], {
        activatedSetBonus: set.requirement,
      }),
    );
    return [
      ...characterCapabilities,
      ...weaponCapabilities,
      ...echoCapabilities,
      ...echoSetCapabilities,
    ].map((capability) => ({
      ...capability,
      parameters: extractUserParameters(capability),
      characterId: character.id,
      characterIndex: index,
      characterIconUrl: characterDetails?.iconUrl,
      characterName: characterDetails?.name ?? 'Unknown',
    }));
  });
  const attacks = fullCapabilities.filter((c) => isAttack(c));
  const modifiers = fullCapabilities.filter((c) => isModifier(c));
  const permanentStats = fullCapabilities.filter((c) => isPermanentStat(c));
  return { attacks, modifiers, permanentStats };
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
