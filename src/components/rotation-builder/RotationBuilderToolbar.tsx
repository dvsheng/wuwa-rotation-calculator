import { Sword, User } from 'lucide-react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { ButtonGroup } from '@/components/ui/button-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function RotationBuilderToolbar({
  selectedTab,
  setSelectedTab,
}: {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}) {
  return (
    <div className="border-border bg-background flex h-12 shrink-0 items-center justify-between border-b px-4">
      <ToggleGroup
        type="single"
        value={selectedTab}
        onValueChange={(value) => {
          if (value) setSelectedTab(value);
        }}
        className="bg-muted/50 border-border grid h-auto grid-cols-2 gap-1 rounded-lg border p-1"
      >
        <ToggleGroupItem
          value="team"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-8 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-all data-[state=on]:shadow-sm"
        >
          <User size={14} /> Team
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rotation"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-8 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-all data-[state=on]:shadow-sm"
        >
          <Sword size={14} /> Rotation
        </ToggleGroupItem>
      </ToggleGroup>
      <ButtonGroup>
        <SaveRotationButton />
        <CalculateRotationButton />
      </ButtonGroup>
    </div>
  );
}
