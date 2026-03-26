import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { useEntities, useEntityCapabilities } from '@/hooks/useEntities';
import type { EntityListRow } from '@/services/game-data';
import { EntityType } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import { Row, Stack } from '../ui/layout';
import { ScrollArea } from '../ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Text } from '../ui/typography';

import { BySkillView } from './BySkillView';
import { ByTypeView } from './ByTypeView';

const TYPE_VIEW = 'type';
const SKILL_VIEW = 'skill';

export const AdminEntity = ({ id }: { id: number }) => {
  const { data: capabilities } = useEntityCapabilities(id);
  const { data: entities } = useEntities({});

  const [view, setView] = useState(TYPE_VIEW);

  const entity = entities.find(({ id: entityId }) => entityId === id);

  if (!entity) {
    return;
  }
  const shouldShowSkillView = entity.type === EntityType.CHARACTER;
  return (
    <ScrollArea className="h-full min-w-0">
      <Stack className="mx-auto w-6xl shrink-0" gap="panel">
        <Row
          gap="trim"
          align="center"
          className="bg-background/95 sticky top-0 z-10 py-2 backdrop-blur"
        >
          <Link
            to="/entities"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Entities
          </Link>
          <ChevronRight className="text-muted-foreground size-4" />
          <Text variant="bodySm">{entity.name}</Text>
        </Row>
        <Row justify="between">
          <AdminEntityHeader entity={entity} />
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
    </ScrollArea>
  );
};

const AdminEntityHeader = (properties: { entity: EntityListRow }) => {
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
