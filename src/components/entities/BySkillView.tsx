import { sortBy, startCase } from 'es-toolkit';

import { SKILL_ORIGIN_ORDER } from '@/components/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEntitySkills } from '@/hooks/useEntities';
import { Sequence, isPermanentStat } from '@/services/game-data';
import type { Capability, Skill } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Row } from '../ui/layout';
import { Text } from '../ui/typography';

import { CapabilityList } from './CapabilityList';
import { SkillHeader } from './SkillHeader';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const BySkillView = ({ capabilities }: { capabilities: Array<Capability> }) => {
  const isMobile = useIsMobile();
  const { data: skills } = useEntitySkills(capabilities[0].entityId);

  const sortedSkills = skills.toSorted(
    (a, b) =>
      SKILL_ORIGIN_ORDER.indexOf(a.originType) -
      SKILL_ORIGIN_ORDER.indexOf(b.originType),
  );
  const skillEntries = sortedSkills.map((skill) => ({
    skill,
    entries: getSkillCapabilities(skill, capabilities),
  }));
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
        defaultValue={skillEntries.map((skill) => String(skill.skill.id))}
      >
        {skillEntries.map(({ skill, entries }) => {
          return (
            <AccordionItem
              key={skill.id}
              id={`skill-${skill.id}`}
              value={String(skill.id)}
            >
              <AccordionTrigger>
                <SkillHeader skill={skill} />
              </AccordionTrigger>
              <AccordionContent>
                <Text variant="bodySm">{skill.description}</Text>
                <CapabilityList entries={entries} showCapabilityTypeBadge />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Row>
  );
};

const hasAlternativeDefinitionForSequence = (
  capability: Capability,
  sequence: Sequence,
) => {
  if (isPermanentStat(capability)) {
    return false;
  }
  return Boolean(capability.capabilityJson.alternativeDefinitions?.[sequence]);
};

const getSkillCapabilities = (
  skill: Skill,
  capabilities: Array<Capability>,
): Array<Capability & { useSequenceDefinition?: Sequence }> => {
  const skillCapabilities = capabilities.filter(
    (capability) => capability.skillId === skill.id,
  );

  if (!Object.values(Sequence).includes(skill.originType as Sequence)) {
    return skillCapabilities;
  }

  const sequence = skill.originType as Sequence;
  const sequenceCapabilities = capabilities
    .filter((capability) => !hasAlternativeDefinitionForSequence(capability, sequence))
    .map((capability) => ({ ...capability, useSequenceDefinition: sequence }));

  return sortBy([...skillCapabilities, ...sequenceCapabilities], ['name']);
};
