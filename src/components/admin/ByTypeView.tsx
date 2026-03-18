import { compact } from 'es-toolkit';
import { useState } from 'react';

import {
  CapabilityTypeAccordion,
  capabilityTypeLabel,
  groupCapabilitiesByType,
  sortSkills,
  typeOrder,
} from './AdminEntityViewShared';
import type { Skill } from './CapabilityItem';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const ByTypeView = ({ skills }: { skills: Array<Skill> }) => {
  const sortedSkills = sortSkills(skills);
  const allCapabilities = sortedSkills.flatMap((skill) =>
    skill.capabilities.map((capability) => ({
      capability,
      skill,
      defaultAlternativeDefinition: 'base' as const,
    })),
  );
  const groups = groupCapabilitiesByType(allCapabilities);
  const defaultOpenValues = typeOrder.filter(
    (type) => (groups.get(type)?.length ?? 0) > 0,
  );
  const [openTypeValues, setOpenTypeValues] =
    useState<Array<string>>(defaultOpenValues);
  const tocItems = compact(
    typeOrder.map((type) => {
      const entries = groups.get(type) ?? [];
      if (entries.length === 0) {
        return;
      }
      return {
        id: `type-${type}`,
        label: capabilityTypeLabel[type],
        badges: [`${entries.length} total`],
        accordionValue: type,
      };
    }),
  );

  return (
    <div className="gap-panel flex flex-col lg:flex-row lg:items-start">
      <TableOfContentsSidebar
        items={tocItems}
        onItemSelect={(item) => {
          if (!item.accordionValue) return;
          const accordionValue = item.accordionValue;
          setOpenTypeValues((currentValues) =>
            currentValues.includes(accordionValue)
              ? currentValues
              : [...currentValues, accordionValue],
          );
        }}
      />
      <div className="min-w-0 flex-1">
        <CapabilityTypeAccordion
          groups={groups}
          idPrefix="type"
          showSkillIcon
          value={openTypeValues}
          onValueChange={setOpenTypeValues}
        />
      </div>
    </div>
  );
};
