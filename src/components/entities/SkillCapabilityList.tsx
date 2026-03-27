import { isPermanentStat } from '@/services/game-data';
import type { PermanentStat } from '@/services/game-data';

import { Stack } from '../ui/layout';

import type { SkillCapabilityEntry } from './adminEntityView.utilities';
import { CapabilityItem, PermanentStatContent } from './CapabilityItem';

type PermanentSkillCapabilityEntry = SkillCapabilityEntry & {
  capability: PermanentStat;
};

export const SkillCapabilityList = ({
  entries,
  entityId,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  entries: Array<SkillCapabilityEntry>;
  entityId: number;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  const standardEntries = entries.filter(
    ({ capability }) => !isPermanentStat(capability),
  );
  const permanentEntries = entries.filter(
    (entry): entry is PermanentSkillCapabilityEntry =>
      isPermanentStat(entry.capability),
  );

  return (
    <Stack gap="inset">
      {standardEntries.map(
        ({
          capability,
          skill,
          defaultAlternativeDefinition,
          isAlternativePlacement,
        }) => (
          <CapabilityItem
            key={`${capability.id}-${defaultAlternativeDefinition}`}
            capability={capability}
            entityId={entityId}
            skill={skill}
            defaultAlternativeDefinition={defaultAlternativeDefinition}
            isAlternativePlacement={isAlternativePlacement}
            showCapabilityTypeBadge={showCapabilityTypeBadge}
            showSkillIcon={showSkillIcon}
          />
        ),
      )}
      {permanentEntries.length > 0 && (
        <PermanentStatContent
          content={permanentEntries.map(({ capability, isAlternativePlacement }) => ({
            ...capability,
            isAlternativePlacement,
          }))}
        />
      )}
    </Stack>
  );
};
