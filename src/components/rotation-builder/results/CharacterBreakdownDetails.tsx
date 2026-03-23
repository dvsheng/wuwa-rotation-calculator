import { CharacterIconDisplay } from '@/components/common/CharacterIcon';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

import type { CharacterBreakdownRow } from './character-breakdown.types';
import { toDisplayName } from './character-breakdown.types';

export const CharacterBreakdownDetails = ({
  selectedCharacter,
}: {
  selectedCharacter: CharacterBreakdownRow;
}) => {
  return (
    <Stack className="h-full min-h-0" gap="component">
      <Row align="center" gap="trim">
        <CharacterIconDisplay url={selectedCharacter.iconUrl} size="xxlarge" />
        <Text variant="heading">{selectedCharacter.characterName}</Text>
      </Row>

      <Stack gap="component" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {selectedCharacter.damageTypes.map((damageType) => (
          <Stack
            key={damageType.damageType}
            gap="trim"
            className="rounded-lg border p-4"
          >
            <Row justify="between" align="start" gap="trim">
              <Stack gap="none" className="min-w-0">
                <Text variant="label">{toDisplayName(damageType.damageType)}</Text>
                <Text variant="caption" tone="muted" tabular={true}>
                  {damageType.pctOfCharacter.toFixed(1)}% of character damage
                </Text>
              </Stack>
              <Text variant="bodySm" tabular={true} className="text-right font-mono">
                {Math.round(damageType.damage).toLocaleString()}
              </Text>
            </Row>

            <Stack gap="trim">
              {damageType.attacks.map((attack) => (
                <Row
                  key={`${damageType.damageType}-${attack.attackIndex}-${attack.attackName}`}
                  justify="between"
                  gap="trim"
                >
                  <Stack gap="none" className="min-w-0">
                    <Text variant="bodySm" className="truncate">
                      {attack.attackName}
                    </Text>
                    <Text variant="caption" tone="muted" tabular={true}>
                      {attack.pctOfDamageType.toFixed(1)}% of{' '}
                      {toDisplayName(damageType.damageType).toLowerCase()}
                    </Text>
                  </Stack>
                  <Stack align="end" gap="none">
                    <Text
                      variant="bodySm"
                      tabular={true}
                      className="text-right font-mono"
                    >
                      {Math.round(attack.damage).toLocaleString()}
                    </Text>
                    <Text
                      variant="caption"
                      tone="muted"
                      tabular={true}
                      className="text-right"
                    >
                      {attack.pctOfCharacter.toFixed(1)}% of character
                    </Text>
                  </Stack>
                </Row>
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
