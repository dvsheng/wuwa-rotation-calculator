import { startCase } from 'es-toolkit';
import { useState } from 'react';

import type { Capability } from '@/services/game-data';

import { EntityIcon } from '../common/EntityIcon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Row, Stack } from '../ui/layout';
import { Text } from '../ui/typography';

import { CapabilityList } from './AdminEntityViewShared';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const BySkillView = ({ capabilities }: { capabilities: Array<Capability> }) => {
  const skills = Object.groupBy(capabilities, (capability) => capability.skillId);
  const skillEntries = Object.entries(skills).filter(
    (entry): entry is [string, Array<Capability>] => {
      const skillCapabilities = entry[1];
      return skillCapabilities !== undefined && skillCapabilities.length > 0;
    },
  );
  const defaultOpenValues = skillEntries.map(([skillId, _]) => skillId);
  const [openSkillValues, setOpenSkillValues] = useState(defaultOpenValues);

  const tocItems = skillEntries.map(([skillId, skillCapabilities]) => ({
    id: `skill-${skillId}`,
    label: skillCapabilities[0].name,
    caption: startCase(skillCapabilities[0].originType),
    accordionValue: skillId,
  }));

  return (
    <div className="gap-panel flex flex-col lg:flex-row lg:items-start">
      <TableOfContentsSidebar
        items={tocItems}
        variant="compact"
        onItemSelect={(item) => {
          if (!item.accordionValue) return;
          const accordionValue = item.accordionValue;
          setOpenSkillValues((currentValues) =>
            currentValues.includes(accordionValue)
              ? currentValues
              : [...currentValues, accordionValue],
          );
        }}
      />
      <div className="min-w-0 flex-1">
        <Accordion
          type="multiple"
          value={openSkillValues}
          onValueChange={setOpenSkillValues}
        >
          {skillEntries.map(([skillId, skillCapabilities]) => {
            const capabilityTypes = Object.groupBy(
              skillCapabilities,
              (capability) => capability.capabilityJson.type,
            );
            const skillProperties = skillCapabilities[0];

            return (
              <AccordionItem key={skillId} id={`skill-${skillId}`} value={skillId}>
                <AccordionTrigger>
                  <Row gap="inset" align="center" wrap>
                    {skillCapabilities[0].iconUrl && (
                      <EntityIcon
                        iconUrl={skillProperties.iconUrl}
                        size="small"
                        className="bg-secondary/60 ring-border/60 ring-1"
                      />
                    )}
                    <Stack gap="none">
                      <Text variant="title">{skillProperties.parentName}</Text>
                      <Text variant="caption" tone="muted">
                        {startCase(skillProperties.originType)}
                      </Text>
                    </Stack>
                    <Row gap="trim" wrap>
                      {Object.entries(capabilityTypes)
                        .filter(([_, entries]) => entries.length > 0)
                        .map(([type, entries]) => (
                          <Badge key={type} variant="outline">
                            {entries.length} {startCase(type)}
                          </Badge>
                        ))}
                    </Row>
                  </Row>
                </AccordionTrigger>
                <AccordionContent>
                  {skillProperties.skillDescription && (
                    <Text
                      variant="bodySm"
                      tone="muted"
                      className="mb-3 whitespace-pre-wrap"
                    >
                      {skillProperties.skillDescription}
                    </Text>
                  )}
                  <CapabilityList entries={skillCapabilities} showCapabilityTypeBadge />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};
