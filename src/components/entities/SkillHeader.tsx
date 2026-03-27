import { startCase } from 'es-toolkit';
import type { ReactNode } from 'react';

import type { Skill } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Row, Stack } from '../ui/layout';
import { Text } from '../ui/typography';

export const SkillHeader = ({
  skill,
  badges,
}: {
  skill: Skill;
  badges?: ReactNode;
}) => {
  return (
    <Row gap="inset" align="center" wrap>
      {skill.iconUrl && (
        <EntityIcon
          iconUrl={skill.iconUrl}
          size="small"
          className="bg-secondary/60 ring-border/60 ring-1"
        />
      )}
      <Stack gap="none">
        <Text variant="title">{skill.name}</Text>
        <Text variant="caption" tone="muted">
          {startCase(skill.originType)}
        </Text>
      </Stack>
      {badges}
    </Row>
  );
};
