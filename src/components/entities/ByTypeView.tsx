import { compact, startCase } from 'es-toolkit';
import { useState } from 'react';

import { CapabilityType } from '@/services/game-data';
import type { Capability } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Text } from '../ui/typography';

import { CapabilityList, typeOrder } from './AdminEntityViewShared';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const ByTypeView = ({ capabilities }: { capabilities: Array<Capability> }) => {
  const groups = Object.groupBy(
    capabilities,
    (capability) => capability.capabilityJson.type,
  );
  const [openTypeValues, setOpenTypeValues] = useState<Array<string>>(
    Object.values(CapabilityType),
  );
  const tocItems = compact(
    Object.entries(groups)
      .filter(([_, entries]) => entries.length > 0)
      .map(([type, _]) => {
        return {
          id: `type-${type}`,
          label: startCase(type),
          accordionValue: type,
        };
      }),
  );

  return (
    <div className="gap-panel flex flex-col lg:flex-row lg:items-start">
      <TableOfContentsSidebar items={tocItems} />
      <div className="min-w-0 flex-1">
        <CapabilityTypeAccordion
          groups={groups}
          entityId={capabilities[0].entityId}
          showSkillIcon
          value={openTypeValues}
          onValueChange={setOpenTypeValues}
        />
      </div>
    </div>
  );
};

const CapabilityTypeAccordion = ({
  groups,
  showCapabilityTypeBadge = false,
  showSkillIcon = false,
  value,
  onValueChange,
}: {
  groups: Partial<Record<CapabilityType, Array<Capability>>>;
  entityId: number;
  showCapabilityTypeBadge?: boolean;
  showSkillIcon?: boolean;
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
}) => {
  return (
    <Accordion type="multiple" value={value} onValueChange={onValueChange}>
      {typeOrder.map((type) => {
        const capabilities = groups[type];
        if (!capabilities || capabilities.length === 0) return;
        return (
          <AccordionItem
            key={type}
            id={`type-${type}`}
            value={type}
            disabled={capabilities.length === 0}
          >
            <AccordionTrigger>
              <Text variant="title">
                {startCase(type)} ({capabilities.length})
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
};
