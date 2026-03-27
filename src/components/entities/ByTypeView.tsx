import { compact } from 'es-toolkit';
import { useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { CapabilityType } from '@/services/game-data';
import type { Capability } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Row } from '../ui/layout';
import { Text } from '../ui/typography';

import { capabilityTypeLabel, typeOrder } from './adminEntityView.utilities';
import { CapabilityList } from './CapabilityList';
import { CapabilityTypeHeader } from './CapabilityTypeHeader';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

export const ByTypeView = ({ capabilities }: { capabilities: Array<Capability> }) => {
  const isMobile = useIsMobile();
  const groups = Object.groupBy(
    capabilities,
    (capability) => capability.capabilityJson.type,
  );
  const [openTypeValues, setOpenTypeValues] = useState<Array<string>>(
    Object.values(CapabilityType),
  );
  const tocItems = compact(
    typeOrder.map((type) => {
      if ((groups[type]?.length ?? 0) === 0) {
        return;
      }

      return {
        id: `type-${type}`,
        label: capabilityTypeLabel[type],
        accordionValue: type,
      };
    }),
  );
  const entityId = capabilities[0]?.entityId;

  return (
    <Row gap="panel" align="start">
      {!isMobile && <TableOfContentsSidebar items={tocItems} />}
      {entityId ? (
        <CapabilityTypeAccordion
          groups={groups}
          showSkillIcon
          value={openTypeValues}
          onValueChange={setOpenTypeValues}
        />
      ) : (
        <Text variant="bodySm" tone="muted">
          No capabilities found.
        </Text>
      )}
    </Row>
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
              <CapabilityTypeHeader capabilityType={type} count={capabilities.length} />
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
