import { startCase } from 'es-toolkit';
import { useState } from 'react';

import { SKILL_ORIGIN_ORDER } from '@/components/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEntitySkills } from '@/hooks/useEntities';
import { Sequence, isPermanentStat } from '@/services/game-data';
import type { Capability, Sequence as SequenceType, Skill } from '@/services/game-data';

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
  const [openSkillValues, setOpenSkillValues] = useState(
    skills.map((skill) => String(skill.id)),
  );

  const sortedSkills = skills.toSorted(
    (a, b) =>
      SKILL_ORIGIN_ORDER.indexOf(a.originType) -
      SKILL_ORIGIN_ORDER.indexOf(b.originType),
  );
  const skillEntries = sortedSkills.map((skill) => ({
    skill,
    entries: buildEntriesForSkill(skill, capabilities),
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
        value={openSkillValues}
        onValueChange={setOpenSkillValues}
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
                <CapabilityList
                  entries={entries.map((entry) => entry.capability)}
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

type SkillCapabilityEntry = {
  capability: Capability;
  skill: Skill;
  defaultAlternativeDefinition: 'base' | SequenceType;
};

const sequenceOrigins = new Set<SequenceType>(Object.values(Sequence));

const hasAlternativeDefinitionForSequence = (
  capability: Capability,
  sequence: SequenceType,
) => {
  if (isPermanentStat(capability)) {
    return false;
  }

  return Boolean(capability.capabilityJson.alternativeDefinitions?.[sequence]);
};

const compareNames = (
  left: string | null | undefined,
  right: string | null | undefined,
) => (left ?? '').localeCompare(right ?? '', undefined, { sensitivity: 'base' });

const sortEntriesByName = (entries: Array<SkillCapabilityEntry>) =>
  entries.toSorted((left, right) => {
    const nameComparison = compareNames(left.capability.name, right.capability.name);
    if (nameComparison !== 0) {
      return nameComparison;
    }
    return left.capability.id - right.capability.id;
  });

const buildEntriesForSkill = (
  skill: Skill,
  capabilities: Array<Capability>,
): Array<SkillCapabilityEntry> => {
  const directEntries = capabilities
    .filter((capability) => capability.skillId === skill.id)
    .map((capability) => ({
      capability,
      skill,
      defaultAlternativeDefinition: 'base' as const,
      isAlternativePlacement: false,
    }));

  if (!sequenceOrigins.has(skill.originType as SequenceType)) {
    return directEntries;
  }

  const sequence = skill.originType as SequenceType;
  const seenCapabilityIds = new Set(
    directEntries.map(({ capability }) => capability.id),
  );
  const sequenceEntries = capabilities.flatMap((capability) => {
    if (
      seenCapabilityIds.has(capability.id) ||
      !hasAlternativeDefinitionForSequence(capability, sequence)
    ) {
      return [];
    }

    seenCapabilityIds.add(capability.id);
    return [
      {
        capability,
        skill,
        defaultAlternativeDefinition: sequence,
        isAlternativePlacement: true,
      },
    ];
  });

  return sortEntriesByName([...directEntries, ...sequenceEntries]);
};
