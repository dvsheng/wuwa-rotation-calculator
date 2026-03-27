import { startCase } from 'es-toolkit';

import type { Skill } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Row, Stack } from '../ui/layout';
import { Text } from '../ui/typography';

export const SkillHeader = ({ skill }: { skill: Skill }) => {
  return (
    <Row gap="inset" align="center" wrap>
      {skill.iconUrl && <EntityIcon iconUrl={skill.iconUrl} size="small" />}
      <Stack gap="none">
        <Text variant="title">{skill.name}</Text>
        <Text variant="caption" tone="muted">
          {startCase(skill.originType)}
        </Text>
      </Stack>
    </Row>
  );
};
