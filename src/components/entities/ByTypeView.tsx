import { useIsMobile } from '@/hooks/use-mobile';
import type { Capability, CapabilityType } from '@/services/game-data';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Row } from '../ui/layout';
import { Text } from '../ui/typography';

import { CapabilityList } from './CapabilityList';
import { TableOfContentsSidebar } from './TableOfContentsSidebar';

const capabilityTypeLabel: Record<Capability['capabilityJson']['type'], string> = {
  attack: 'Attacks',
  modifier: 'Modifiers',
  permanent_stat: 'Permanent Stats',
};

const typeOrder = ['attack', 'modifier', 'permanent_stat'] as const;

export const ByTypeView = ({ capabilities }: { capabilities: Array<Capability> }) => {
  const isMobile = useIsMobile();

  const groups = Object.groupBy(
    capabilities,
    (capability) => capability.capabilityJson.type,
  );
  const tocItems = typeOrder
    .filter((type) => groups[type]?.length && groups[type].length > 0)
    .map((type) => ({
      id: `type-${type}`,
      label: capabilityTypeLabel[type],
      accordionValue: type,
    }));

  return (
    <Row gap="panel" align="start">
      {!isMobile && <TableOfContentsSidebar items={tocItems} />}
      <CapabilityTypeAccordion groups={groups} />
    </Row>
  );
};

const CapabilityTypeAccordion = ({
  groups,
}: {
  groups: Partial<Record<CapabilityType, Array<Capability>>>;
}) => (
  <Accordion type="multiple" defaultValue={Object.keys(groups)}>
    {Object.entries(groups)
      .toSorted(
        (group1, group2) =>
          typeOrder.indexOf(group1[0] as CapabilityType) -
          typeOrder.indexOf(group2[0] as CapabilityType),
      )
      .map(([type, capabilities]) => (
        <AccordionItem
          key={type}
          id={`type-${type}`}
          value={type}
          disabled={capabilities.length === 0}
        >
          <AccordionTrigger>
            <Text variant="title">
              {capabilityTypeLabel[type as CapabilityType]} ({capabilities.length})
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <CapabilityList entries={capabilities} showSkillIcon={true} />
          </AccordionContent>
        </AccordionItem>
      ))}
  </Accordion>
);
