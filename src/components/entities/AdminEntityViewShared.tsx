import { isPermanentStat } from '@/services/game-data';
import type { Capability } from '@/services/game-data';

import { Stack } from '../ui/layout';

import { CapabilityItem, PermanentStatContent } from './CapabilityItem';

export const typeOrder = ['attack', 'modifier', 'permanent_stat'] as const;

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
  const permanentEntries = entries.filter((capability) => isPermanentStat(capability));
  const entityId = entries[0].entityId;

  return (
    <Stack gap="inset">
      {standardEntries.map((stat) => (
        <CapabilityItem
          key={stat.id}
          capability={stat}
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
