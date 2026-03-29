import type { ReactNode } from 'react';
import { useState } from 'react';

import type { Capability, Sequence } from '@/services/game-data';
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

import { ReportCapabilityIssueDialog } from './ReportCapabilityIssueDialog';

type AlternativeDefinitionValue = 'base' | Sequence;

const getAlternativeDefinitions = (capability: Capability) => {
  if (capability.capabilityJson.type === 'permanent_stat') return [];
  const { alternativeDefinitions } = capability.capabilityJson;
  if (!alternativeDefinitions) return [];
  return Object.keys(alternativeDefinitions) as Array<Sequence>;
};

export const CapabilityCard = ({
  capability,
  defaultDefinition = 'base',
  entityId,
  titlePrefix,
  titleSuffix,
  renderCapability,
}: {
  capability: Capability;
  defaultDefinition?: AlternativeDefinitionValue;
  entityId?: number;
  titlePrefix?: ReactNode;
  titleSuffix?: ReactNode;
  renderCapability: (capability: Capability) => ReactNode;
}) => {
  const [isJsonView, setIsJsonView] = useState(false);

  const [selectedAlternativeDefinition, setSelectedAlternativeDefinition] =
    useState<string>(defaultDefinition);

  const alternativeDefinitions = getAlternativeDefinitions(capability);
  const resolvedCapability = resolveAlternativeDefinitions(
    capability,
    sequenceToNumber(selectedAlternativeDefinition),
  );
  return (
    <Card>
      <CardHeader>
        <Row justify="between" align="start" wrap={true} gap="inset">
          <Row gap="inset" align="center">
            {titlePrefix}
            <Row gap="trim" align="center">
              <CardTitle>{capability.name}</CardTitle>
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
                onValueChange={setSelectedAlternativeDefinition}
              >
                <ToggleGroupItem value="base">Base</ToggleGroupItem>
                {alternativeDefinitions.map((definition) => (
                  <ToggleGroupItem key={definition} value={definition}>
                    {definition.toUpperCase()}
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
            renderCapability(resolvedCapability)
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
