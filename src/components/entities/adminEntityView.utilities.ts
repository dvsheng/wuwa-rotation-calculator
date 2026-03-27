import { SKILL_ORIGIN_ORDER } from '@/components/constants';
import { Sequence, isPermanentStat } from '@/services/game-data';
import type { Capability, Sequence as SequenceType, Skill } from '@/services/game-data';

export const typeOrder = ['attack', 'modifier', 'permanent_stat'] as const;

export const capabilityTypeLabel: Record<Capability['capabilityJson']['type'], string> =
  {
    attack: 'Attacks',
    modifier: 'Modifiers',
    permanent_stat: 'Permanent Stats',
  };

export type SkillCapabilityEntry = {
  capability: Capability;
  skill: Skill;
  defaultAlternativeDefinition: 'base' | SequenceType;
  isAlternativePlacement: boolean;
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

    const placementComparison =
      Number(left.isAlternativePlacement) - Number(right.isAlternativePlacement);
    if (placementComparison !== 0) {
      return placementComparison;
    }

    return left.capability.id - right.capability.id;
  });

export const sortSkills = (skills: Array<Skill>) =>
  skills.toSorted(
    (a, b) =>
      SKILL_ORIGIN_ORDER.indexOf(a.originType) -
      SKILL_ORIGIN_ORDER.indexOf(b.originType),
  );

export const buildEntriesForSkill = (
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

export const getCapabilityTypeCounts = (entries: Array<SkillCapabilityEntry>) =>
  typeOrder.map((type) => ({
    type,
    count: entries.filter(({ capability }) => capability.capabilityJson.type === type)
      .length,
  }));
