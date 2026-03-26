import { createServerFn } from '@tanstack/react-start';

import type { ResolveConfig } from '@/schemas/game-data-service';
import { ListEntityCapabilitiesRequestSchema } from '@/schemas/game-data-service';

import {
  resolveAlternativeDefinitions,
  resolveStoreNumberType,
  sequenceToNumber,
} from './database-type-adapters';
import type {
  ResolveAlternativeDefinitions,
  ResolveRefineScalableNumber,
} from './database-type-adapters';
import { listEntityCapabilitiesHandler } from './list-entity-capabilities.server';
import type { Capability, RefineLevel, Sequence } from './types';

export type CapabilityResolverOptions = ResolveConfig;

export type ResolvedCapability = ResolveAlternativeDefinitions<
  ResolveRefineScalableNumber<Capability>
>;

export const filterAndResolveCapabilities = (
  capabilities: Array<Capability>,
  resolveConfig: CapabilityResolverOptions,
): Array<ResolvedCapability> => {
  return capabilities
    .filter((capability) =>
      isCapabilityActive(
        capability,
        resolveConfig.sequence,
        resolveConfig.activatedSetBonus,
      ),
    )
    .map((capability) =>
      resolveStoreNumberType(
        resolveAlternativeDefinitions(capability, resolveConfig.sequence),
        refineLevelToNumber(resolveConfig.refineLevel),
      ),
    );
};

/**
 * Lists all stored capabilities for an entity.
 */
export const listEntityCapabilities = createServerFn({
  method: 'GET',
})
  .inputValidator(ListEntityCapabilitiesRequestSchema)
  .handler(async ({ data }) => {
    return await listEntityCapabilitiesHandler(data);
  });

const refineLevelToNumber = (refineLevel?: RefineLevel): number => {
  if (!refineLevel) return 0;
  return Number.parseInt(refineLevel);
};

/**
 * Check if a capability is active at the given sequence.
 */
const isCapabilityActive = (
  item: { originType?: string; parentName?: string },
  activatedSequence: number = 0,
  activatedSetBonus: number = 0,
): boolean => {
  // Check sequence requirement
  const unlockedAtSequence = sequenceToNumber(item.originType as Sequence);
  if (activatedSequence < unlockedAtSequence) {
    return false;
  }
  // Check set bonus requirement (e.g., "Frosty Resolve - 2" requires activatedSetBonus >= 2)
  const setBonusMatch = item.parentName?.match(/ - (\d+)$/);
  if (setBonusMatch) {
    const setBonusRequirement = Number.parseInt(setBonusMatch[1], 10);
    return activatedSetBonus >= setBonusRequirement;
  }
  // No set bonus requirement, capability is active
  return true;
};
