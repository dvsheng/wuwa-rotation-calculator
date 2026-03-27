import { startCase } from 'es-toolkit';
import { useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import type { Capability, Skill } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Row } from '../ui/layout';
import { Text } from '../ui/typography';

import {
  buildEntriesForSkill,
  getCapabilityTypeCounts,
  sortSkills,
} from './adminEntityView.utilities';
import { SkillCapabilityList } from './SkillCapabilityList';
import { SkillHeader } from './SkillHeader';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const BySkillView = ({
  capabilities,
  skills,
}: {
  capabilities: Array<Capability>;
  skills: Array<Skill>;
}) => {
  const isMobile = useIsMobile();
  const sortedSkills = sortSkills(skills);
  const skillEntries = sortedSkills.map((skill) => ({
    skill,
    entries: buildEntriesForSkill(skill, capabilities),
  }));
  const defaultOpenValues = skillEntries.map(({ skill }) => String(skill.id));
  const [openSkillValues, setOpenSkillValues] = useState(defaultOpenValues);

  const tocItems = skillEntries.map(({ skill }) => ({
    id: `skill-${skill.id}`,
    label: skill.name,
    caption: startCase(skill.originType),
    accordionValue: String(skill.id),
  }));

  return (
    <Row gap="panel" align="start">
      {!isMobile && <TableOfContentsSidebar items={tocItems} />}
      <Accordion
        type="multiple"
        value={openSkillValues}
        onValueChange={setOpenSkillValues}
      >
        {skillEntries.map(({ skill, entries }) => {
          const capabilityTypes = getCapabilityTypeCounts(entries);

          return (
            <AccordionItem
              key={skill.id}
              id={`skill-${skill.id}`}
              value={String(skill.id)}
            >
              <AccordionTrigger>
                <SkillHeader
                  skill={skill}
                  badges={
                    <Row gap="trim" wrap>
                      {capabilityTypes
                        .filter(({ count }) => count > 0)
                        .map(({ type, count }) => (
                          <Badge key={type} variant="outline">
                            {count} {startCase(type)}
                          </Badge>
                        ))}
                    </Row>
                  }
                />
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
                <SkillCapabilityList
                  entries={entries}
                  entityId={skill.entityId}
                  showCapabilityTypeBadge
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Row>
  );
};
