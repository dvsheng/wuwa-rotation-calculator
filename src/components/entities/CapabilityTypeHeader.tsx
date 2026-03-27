import type { Capability } from '@/services/game-data';

import { Text } from '../ui/typography';

import { capabilityTypeLabel } from './adminEntityView.utilities';

export const CapabilityTypeHeader = ({
  capabilityType,
  count,
}: {
  capabilityType: Capability['capabilityJson']['type'];
  count: number;
}) => {
  return (
    <Text variant="title">
      {capabilityTypeLabel[capabilityType]} ({count})
    </Text>
  );
};
