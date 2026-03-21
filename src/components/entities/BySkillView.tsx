import { startCase } from 'es-toolkit';
import { useState } from 'react';

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

import {
  CapabilityList,
  buildEntriesForSkill,
  capabilityTypeLabel,
  getCapabilityTypeCounts,
  sortSkills,
  useSelectedCapabilityScroll,
} from './AdminEntityViewShared';
import type { Skill } from './CapabilityItem';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const BySkillView = ({
  skills,
  entityId,
  selectedCapabilityId,
}: {
  skills: Array<Skill>;
  entityId: number;
  selectedCapabilityId?: number;
}) => {
  const sorted = sortSkills(skills);
  const skillEntries = sorted.map((skill) => ({
    skill,
    entries: buildEntriesForSkill(skill, skills),
  }));
  const defaultOpenValues = skillEntries
    .filter(({ entries }) => entries.length > 0)
    .map(({ skill }) => String(skill.id));
  const [openSkillValues, setOpenSkillValues] = useState(defaultOpenValues);
  const selectedSkillValues = selectedCapabilityId
    ? skillEntries
        .filter(({ entries }) =>
          entries.some(({ capability }) => capability.id === selectedCapabilityId),
        )
        .map(({ skill }) => String(skill.id))
    : [];
  const effectiveOpenSkillValues = [
    ...new Set([...openSkillValues, ...selectedSkillValues]),
  ];
  useSelectedCapabilityScroll(selectedCapabilityId, effectiveOpenSkillValues.join('|'));
  const tocItems = skillEntries.map(({ skill }) => ({
    id: `skill-${skill.id}`,
    label: skill.name,
    caption: startCase(skill.originType),
    accordionValue: String(skill.id),
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
          value={effectiveOpenSkillValues}
          onValueChange={setOpenSkillValues}
        >
          {skillEntries.map(({ skill, entries }) => {
            const typeCounts = getCapabilityTypeCounts(entries);
            return (
              <AccordionItem
                key={skill.id}
                id={`skill-${skill.id}`}
                value={String(skill.id)}
              >
                <AccordionTrigger>
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
                    <Row gap="trim" wrap>
                      {typeCounts
                        .filter(({ count }) => count > 0)
                        .map(({ type, count }) => (
                          <Badge key={type} variant="outline">
                            {count} {capabilityTypeLabel[type]}
                          </Badge>
                        ))}
                    </Row>
                  </Row>
                </AccordionTrigger>
                <AccordionContent>
                  {skill.description && (
                    <Text
                      variant="bodySm"
                      tone="muted"
                      className="mb-3 whitespace-pre-wrap"
                    >
                      {skill.description}
                    </Text>
                  )}
                  <CapabilityList
                    entries={entries}
                    entityId={entityId}
                    showCapabilityTypeBadge
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};
