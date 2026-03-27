import { isPermanentStat } from '@/services/game-data';
import type { Capability, Sequence } from '@/services/game-data';

import { Stack } from '../ui/layout';

import { CapabilityItem, PermanentStatContent } from './CapabilityItem';

export const CapabilityList = ({
  entries,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  entries: Array<Capability & { defaultDefinition?: 'base' | Sequence }>;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  const standardEntries = entries.filter((capability) => !isPermanentStat(capability));
  const permanentEntries = entries.filter((capability) => isPermanentStat(capability));
  const entityId = entries[0]?.entityId;

  if (!entityId) {
    return;
  }

  return (
    <Stack gap="inset">
      {standardEntries.map((capability) => (
        <CapabilityItem
          key={capability.id}
          capability={capability}
          showCapabilityTypeBadge={showCapabilityTypeBadge}
          defaultDefinition={capability.defaultDefinition}
          showSkillIcon={showSkillIcon}
        />
      ))}
      {permanentEntries.length > 0 && (
        <PermanentStatContent content={permanentEntries} />
      )}
    </Stack>
  );
};
