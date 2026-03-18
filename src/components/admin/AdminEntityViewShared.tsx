import { SKILL_ORIGIN_ORDER } from '@/components/constants';
import { Sequence } from '@/services/game-data';
import type { Sequence as SequenceType } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Stack } from '../ui/layout';
import { Text } from '../ui/typography';

import { CapabilityItem, PermanentStatContent } from './CapabilityItem';
import type { Capability, PermanentStatArray, Skill } from './CapabilityItem';

type CapabilityJson = Capability['capabilityJson'];

export const typeOrder: Array<CapabilityJson['type']> = [
  'attack',
  'modifier',
  'permanent_stat',
];

export const capabilityTypeLabel: Record<CapabilityJson['type'], string> = {
  attack: 'Attacks',
  modifier: 'Modifiers',
  permanent_stat: 'Permanent Stats',
};

export type SkillCapability = {
  capability: Capability;
  skill: Skill;
  defaultAlternativeDefinition: 'base' | SequenceType;
};

const sequenceOrigins = new Set<SequenceType>(Object.values(Sequence));

const hasAlternativeDefinitionForSequence = (
  capability: Capability,
  sequence: SequenceType,
) => {
  if (capability.capabilityJson.type === 'permanent_stat') {
    return false;
  }

  return Boolean(capability.capabilityJson.alternativeDefinitions?.[sequence]);
};

export const buildEntriesForSkill = (
  skill: Skill,
  skills: Array<Skill>,
): Array<SkillCapability> => {
  const directEntries = skill.capabilities.map((capability) => ({
    capability,
    skill,
    defaultAlternativeDefinition: 'base' as const,
  }));

  if (!sequenceOrigins.has(skill.originType as SequenceType)) {
    return directEntries;
  }

  const sequence = skill.originType as SequenceType;
  const seenCapabilityIds = new Set(
    directEntries.map(({ capability }) => capability.id),
  );
  const sequenceEntries = skills.flatMap((sourceSkill) =>
    sourceSkill.capabilities.flatMap((capability) => {
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
        },
      ];
    }),
  );

  return [...directEntries, ...sequenceEntries];
};

export const groupCapabilitiesByType = (entries: Array<SkillCapability>) => {
  const groups = new Map<CapabilityJson['type'], Array<SkillCapability>>();
  for (const entry of entries) {
    const type = entry.capability.capabilityJson.type;
    const list = groups.get(type) ?? [];
    list.push(entry);
    groups.set(type, list);
  }
  return groups;
};

export const getCapabilityTypeCounts = (entries: Array<SkillCapability>) =>
  typeOrder.map((type) => ({
    type,
    count: entries.filter(({ capability }) => capability.capabilityJson.type === type)
      .length,
  }));

export const toCapabilityCountBadges = (entries: Array<SkillCapability>) =>
  getCapabilityTypeCounts(entries)
    .filter(({ count }) => count > 0)
    .map(({ type, count }) => `${count} ${capabilityTypeLabel[type]}`);

export const sortSkills = (skills: Array<Skill>) =>
  skills.toSorted(
    (a, b) =>
      SKILL_ORIGIN_ORDER.indexOf(a.originType) -
      SKILL_ORIGIN_ORDER.indexOf(b.originType),
  );

export const CapabilityList = ({
  entries,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
}: {
  entries: Array<SkillCapability>;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
}) => {
  const standardEntries = entries.filter(
    ({ capability }) => capability.capabilityJson.type !== 'permanent_stat',
  );
  const permanentEntries = entries.filter(
    ({ capability }) => capability.capabilityJson.type === 'permanent_stat',
  );

  return (
    <Stack gap="inset">
      {standardEntries.map(({ capability, skill, defaultAlternativeDefinition }) => (
        <CapabilityItem
          key={capability.id}
          capability={capability}
          skill={skill}
          defaultAlternativeDefinition={defaultAlternativeDefinition}
          showCapabilityTypeBadge={showCapabilityTypeBadge}
          showSkillIcon={showSkillIcon}
        />
      ))}
      {permanentEntries.length > 0 && (
        <PermanentStatContent
          content={
            permanentEntries.map(({ capability }) => ({
              ...capability.capabilityJson,
              name: capability.name ?? '',
              description: capability.description,
            })) as PermanentStatArray
          }
        />
      )}
    </Stack>
  );
};

export const CapabilityTypeAccordion = ({
  groups,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
  idPrefix,
  value,
  onValueChange,
}: {
  groups: Map<CapabilityJson['type'], Array<SkillCapability>>;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
  idPrefix?: string;
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
}) => (
  <Accordion
    type="multiple"
    value={value}
    onValueChange={onValueChange}
    defaultValue={
      value
        ? undefined
        : typeOrder.filter((type) => (groups.get(type)?.length ?? 0) > 0)
    }
  >
    {typeOrder.map((type) => {
      const capabilities = groups.get(type);
      if (!capabilities || capabilities.length === 0) return;
      return (
        <AccordionItem
          key={type}
          id={idPrefix ? `${idPrefix}-${type}` : undefined}
          value={type}
          disabled={capabilities.length === 0}
        >
          <AccordionTrigger>
            <Text variant="title">
              {capabilityTypeLabel[type]} ({capabilities.length})
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <CapabilityList
              entries={capabilities}
              showCapabilityTypeBadge={showCapabilityTypeBadge}
              showSkillIcon={showSkillIcon}
            />
          </AccordionContent>
        </AccordionItem>
      );
    })}
  </Accordion>
);
