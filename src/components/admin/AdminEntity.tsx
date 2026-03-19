import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useAdminEntity } from '@/hooks/useAdminEntities';
import type { DetailedAdminEntity } from '@/hooks/useAdminEntities';
import { EntityType } from '@/services/game-data';

import { DataLoadFailed } from '../common/DataLoadFailed';
import { EntityIcon } from '../common/EntityIcon';
import { Row, Stack } from '../ui/layout';
import { ScrollArea } from '../ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Text } from '../ui/typography';

import { BySkillView } from './BySkillView';
import { ByTypeView } from './ByTypeView';

type GroupMode = 'skill' | 'type';

export type AdminEntityProperties = DetailedAdminEntity;

type Entity = DetailedAdminEntity['entity'];

export const AdminEntity = ({
  id,
  capabilityId,
}: {
  id: number;
  capabilityId?: number;
}) => {
  return (
    <ErrorBoundary fallback={<DataLoadFailed />}>
      <AdminEntityContent id={id} capabilityId={capabilityId} />
    </ErrorBoundary>
  );
};

const AdminEntityContent = ({
  id,
  capabilityId,
}: {
  id: number;
  capabilityId?: number;
}) => {
  const { data } = useAdminEntity(id);
  const supportsBySkill = data.entity.type === EntityType.CHARACTER;
  const [groupMode, setGroupMode] = useState<GroupMode>(
    supportsBySkill ? 'skill' : 'type',
  );
  const activeGroupMode: GroupMode = supportsBySkill ? groupMode : 'type';

  const { skills } = data.entity;
  return (
    <ScrollArea className="h-full min-w-0">
      <Stack className="mx-auto w-6xl shrink-0" gap="panel">
        <Row
          gap="trim"
          align="center"
          className="bg-background/95 sticky top-0 z-10 py-2 backdrop-blur"
        >
          <Link
            to="/admin/entities"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Entities
          </Link>
          <ChevronRight className="text-muted-foreground size-4" />
          <Text variant="bodySm">{data.entity.name}</Text>
        </Row>
        <Row justify="between">
          <AdminEntityHeader entity={data.entity} />
          {supportsBySkill && (
            <ToggleGroup
              type="single"
              value={groupMode}
              onValueChange={(value) => {
                if (value) setGroupMode(value as GroupMode);
              }}
            >
              <ToggleGroupItem value="skill">By Skill</ToggleGroupItem>
              <ToggleGroupItem value="type">By Type</ToggleGroupItem>
            </ToggleGroup>
          )}
        </Row>
        {activeGroupMode === 'skill' ? (
          <BySkillView
            skills={skills}
            entityId={id}
            selectedCapabilityId={capabilityId}
          />
        ) : (
          <ByTypeView
            skills={skills}
            entityId={id}
            selectedCapabilityId={capabilityId}
          />
        )}
      </Stack>
    </ScrollArea>
  );
};

const AdminEntityHeader = (properties: {
  entity: Pick<Entity, 'name' | 'iconUrl' | 'description'>;
}) => {
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
