import { Sword, User } from 'lucide-react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';

import { Row } from '../ui/layout';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export function RotationBuilderToolbar({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}) {
  return (
    <Row
      align="center"
      justify="between"
      className="border-border bg-background px-panel h-12 shrink-0 border-b"
    >
      <Tabs
        value={selectedTab}
        onValueChange={(value) => {
          setSelectedTab(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="team">
            <User size={14} /> Team
          </TabsTrigger>
          <TabsTrigger value="rotation">
            <Sword size={14} /> Rotation
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ButtonGroup>
        <SaveRotationButton />
        <CalculateRotationButton />
      </ButtonGroup>
    </Row>
  );
}
