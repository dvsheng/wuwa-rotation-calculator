import { isPermanentStat } from '@/services/game-data';
import type { Capability, PermanentStat } from '@/services/game-data';

import { Stack } from '../ui/layout';

import { CapabilityItem, PermanentStatContent } from './CapabilityItem';

type PermanentCapability = PermanentStat;

export const CapabilityList = ({
  entries,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  entries: Array<Capability>;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  const standardEntries = entries.filter((capability) => !isPermanentStat(capability));
  const permanentEntries = entries.filter(
    (capability): capability is PermanentCapability => isPermanentStat(capability),
  );
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
          entityId={entityId}
          showCapabilityTypeBadge={showCapabilityTypeBadge}
          showSkillIcon={showSkillIcon}
        />
      ))}
      {permanentEntries.length > 0 && (
        <PermanentStatContent content={permanentEntries} />
      )}
    </Stack>
  );
};
