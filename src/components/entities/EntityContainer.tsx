import { useState } from 'react';

import { useEntities, useEntityCapabilities } from '@/hooks/useEntities';
import type { EntityListRow } from '@/services/game-data';
import { EntityType } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Row, Stack } from '../ui/layout';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Text } from '../ui/typography';

import { BySkillView } from './BySkillView';
import { ByTypeView } from './ByTypeView';

const TYPE_VIEW = 'type';
const SKILL_VIEW = 'skill';

export const EntityContainer = ({ id }: { id: number }) => {
  const { data: capabilities } = useEntityCapabilities(id);
  const { data: entities } = useEntities({});
  const [view, setView] = useState(TYPE_VIEW);

  const entity = entities.find(({ id: entityId }) => entityId === id);
  if (!entity) {
    return;
  }

  const shouldShowSkillView = entity.type === EntityType.CHARACTER;
  return (
    <Stack gap="page">
      <Row justify="between">
        <EntityContainerHeader entity={entity} />
        {shouldShowSkillView && (
          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={setView}
          >
            <ToggleGroupItem value={SKILL_VIEW}>By Skill</ToggleGroupItem>
            <ToggleGroupItem value={TYPE_VIEW}>By Type</ToggleGroupItem>
          </ToggleGroup>
        )}
      </Row>
      {view === SKILL_VIEW ? (
        <BySkillView capabilities={capabilities} />
      ) : (
        <ByTypeView capabilities={capabilities} />
      )}
    </Stack>
  );
};

const EntityContainerHeader = (properties: { entity: EntityListRow }) => {
  const { entity } = properties;
  return (
    <Row gap="component" align="center">
      <EntityIcon iconUrl={entity.iconUrl} size="xxlarge" />
      <Stack gap="none">
        <Text variant="heading">{entity.name}</Text>
        {entity.description && (
          <Text variant="bodySm" tone="muted">
            {entity.description}
          </Text>
        )}
      </Stack>
    </Row>
  );
};
