import type { Capability } from '@/services/game-data';

export const typeOrder = ['attack', 'modifier', 'permanent_stat'] as const;

export const capabilityTypeLabel: Record<Capability['capabilityJson']['type'], string> =
  {
    attack: 'Attacks',
    modifier: 'Modifiers',
    permanent_stat: 'Permanent Stats',
  };

export const getCapabilityAnchorId = (capabilityId: number) =>
  `capability-${capabilityId}`;
