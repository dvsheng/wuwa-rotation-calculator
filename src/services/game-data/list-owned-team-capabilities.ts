import { groupBy } from 'es-toolkit';

import type { Team } from '@/schemas/team';
import type { Capability } from '@/services/game-data';

import {
  filterAndResolveCapabilities,
  listCapabilities,
} from './list-capabilities.function';
import type {
  CapabilityResolverOptions,
  ResolvedCapability,
} from './list-capabilities.function';

type TeamCharacter = Team[number];

type CapabilityOwner<TCharacterOwner extends object> = {
  entityId: number;
  characterOwner: TCharacterOwner;
  resolveConfig: CapabilityResolverOptions;
};

export type OwnedCapability<TCharacterOwner extends object> = ResolvedCapability &
  TCharacterOwner & {
    entityId: number;
  };

export const listOwnedCapabilitiesForTeam = async <TCharacterOwner extends object>(
  team: Team,
  getCharacterOwner: (
    character: TeamCharacter,
    characterIndex: number,
  ) => TCharacterOwner,
): Promise<Array<OwnedCapability<TCharacterOwner>>> => {
  const capabilityOwners = buildCapabilityOwners(team, getCharacterOwner);
  if (capabilityOwners.length === 0) {
    return [];
  }

  return attachCapabilityOwners(
    await listCapabilities({
      data: {
        entityIds: [...new Set(capabilityOwners.map((owner) => owner.entityId))],
      },
    }),
    capabilityOwners,
  );
};

const buildCapabilityOwners = <TCharacterOwner extends object>(
  team: Team,
  getCharacterOwner: (
    character: TeamCharacter,
    characterIndex: number,
  ) => TCharacterOwner,
): Array<CapabilityOwner<TCharacterOwner>> => {
  return team.flatMap((character, characterIndex) => {
    const characterOwner = getCharacterOwner(character, characterIndex);

    return [
      {
        entityId: character.id,
        characterOwner,
        resolveConfig: { sequence: character.sequence },
      },
      {
        entityId: character.weapon.id,
        characterOwner,
        resolveConfig: { refineLevel: character.weapon.refine },
      },
      {
        entityId: character.primarySlotEcho.id,
        characterOwner,
        resolveConfig: {},
      },
      ...character.echoSets.map((set) => ({
        entityId: set.id,
        characterOwner,
        resolveConfig: {
          activatedSetBonus: Number.parseInt(set.requirement) as 2 | 3 | 5,
        },
      })),
    ];
  });
};

const attachCapabilityOwners = <TCharacterOwner extends object>(
  capabilities: Array<Capability>,
  capabilityOwners: Array<CapabilityOwner<TCharacterOwner>>,
): Array<OwnedCapability<TCharacterOwner>> => {
  const capaByEntityId = groupBy(capabilities, (capability) => capability.entityId);
  const ownerByEntityId = groupBy(capabilityOwners, (owner) => owner.entityId);

  return Object.entries(ownerByEntityId).flatMap(([entityId, owners]) =>
    owners.flatMap((owner) =>
      filterAndResolveCapabilities(
        capaByEntityId[Number.parseInt(entityId)] ?? [],
        owner.resolveConfig,
      ).map((capability) => ({
        ...capability,
        ...owner.characterOwner,
        entityId: Number.parseInt(entityId),
      })),
    ),
  );
};
