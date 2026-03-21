import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { Sequence } from '@/services/game-data';
import {
  resolveAlternativeDefinitions,
  sequenceToNumber,
} from '@/services/game-data/database-type-adapters';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Row, Stack } from '../ui/layout';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Text } from '../ui/typography';

import type { Capability } from './CapabilityItem';
import { ReportCapabilityIssueDialog } from './ReportCapabilityIssueDialog';

type CardCapability = Pick<
  Capability,
  'id' | 'name' | 'description' | 'capabilityJson'
>;

type AlternativeDefinitionValue = 'base' | Sequence;

const getAlternativeDefinitions = (capability: CardCapability) => {
  if (capability.capabilityJson.type === 'permanent_stat') {
    return [];
  }

  const { alternativeDefinitions } = capability.capabilityJson;
  if (!alternativeDefinitions) {
    return [];
  }

  return (Object.keys(alternativeDefinitions) as Array<AlternativeDefinitionValue>)
    .filter((definition): definition is Exclude<AlternativeDefinitionValue, 'base'> => {
      return definition !== 'base';
    })
    .toSorted((a, b) => sequenceToNumber(a) - sequenceToNumber(b));
};

const formatAlternativeDefinitionLabel = (definition: AlternativeDefinitionValue) => {
  return definition === 'base' ? 'Base' : definition.toUpperCase();
};

const normalizeAlternativeDefinitionValue = (
  alternativeDefinitions: Array<Sequence>,
  value: AlternativeDefinitionValue,
): AlternativeDefinitionValue => {
  if (value === 'base') {
    return value;
  }

  return alternativeDefinitions.includes(value) ? value : 'base';
};

export const CapabilityCard = ({
  capability,
  defaultAlternativeDefinition = 'base',
  entityId,
  titlePrefix,
  titleSuffix,
  children,
}: {
  capability: CardCapability;
  defaultAlternativeDefinition?: AlternativeDefinitionValue;
  entityId?: number;
  titlePrefix?: ReactNode;
  titleSuffix?: ReactNode;
  children: (capability: CardCapability) => ReactNode;
}) => {
  const [isJsonView, setIsJsonView] = useState(false);
  const alternativeDefinitions = getAlternativeDefinitions(capability);
  const normalizedDefaultAlternativeDefinition = normalizeAlternativeDefinitionValue(
    alternativeDefinitions,
    defaultAlternativeDefinition,
  );
  const [selectedAlternativeDefinition, setSelectedAlternativeDefinition] =
    useState<AlternativeDefinitionValue>(normalizedDefaultAlternativeDefinition);

  const resolvedCapability =
    alternativeDefinitions.length > 0
      ? resolveAlternativeDefinitions(
          capability,
          sequenceToNumber(selectedAlternativeDefinition),
        )
      : capability;

  return (
    <Card>
      <CardHeader>
        <Row justify="between" align="start" wrap={true} gap="inset">
          <Row gap="inset" align="center">
            {titlePrefix}
            <Row gap="trim" align="center">
              <CardTitle>
                {entityId ? (
                  <Link
                    to="/entities/$id"
                    params={{ id: String(entityId) }}
                    search={{ capabilityId: capability.id }}
                    className="hover:text-foreground text-foreground transition-colors hover:underline"
                  >
                    {capability.name}
                  </Link>
                ) : (
                  capability.name
                )}
              </CardTitle>
              {titleSuffix}
            </Row>
          </Row>
          <Row gap="component" align="center" wrap={true}>
            <ReportCapabilityIssueDialog
              capability={capability}
              entityId={entityId}
              alternativeDefinition={selectedAlternativeDefinition}
            />
            <Row gap="inset" align="center">
              <Switch checked={isJsonView} onCheckedChange={setIsJsonView} />
              <Label>JSON View</Label>
            </Row>
          </Row>
        </Row>
        {resolvedCapability.description && (
          <CardDescription>{resolvedCapability.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Stack gap="inset">
          {alternativeDefinitions.length > 0 && (
            <Row gap="inset">
              <Text variant="label" tone="muted">
                Alternative Definition:
              </Text>
              <ToggleGroup
                type="single"
                variant="outline"
                value={selectedAlternativeDefinition}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedAlternativeDefinition(
                      value as AlternativeDefinitionValue,
                    );
                  }
                }}
              >
                <ToggleGroupItem value="base">
                  {formatAlternativeDefinitionLabel('base')}
                </ToggleGroupItem>
                {alternativeDefinitions.map((definition) => (
                  <ToggleGroupItem key={definition} value={definition}>
                    {formatAlternativeDefinitionLabel(definition)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Row>
          )}
          {isJsonView ? (
            <Textarea
              readOnly
              value={JSON.stringify(resolvedCapability.capabilityJson, undefined, 4)}
            />
          ) : (
            children(resolvedCapability)
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
