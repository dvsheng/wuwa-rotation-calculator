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
    <div className="border-border bg-background px-panel flex h-12 shrink-0 items-center justify-between border-b">
      <ToggleGroup
        type="single"
        value={selectedTab}
        onValueChange={(value) => {
          if (value) setSelectedTab(value);
        }}
        className="bg-muted/50 border-border gap-tight p-tight grid h-auto grid-cols-2 rounded-lg border"
      >
        <ToggleGroupItem
          value="team"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground gap-compact px-panel flex h-8 items-center justify-center rounded-md text-sm font-medium transition-all data-[state=on]:shadow-sm"
        >
          <User size={14} /> Team
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rotation"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground gap-compact px-panel flex h-8 items-center justify-center rounded-md text-sm font-medium transition-all data-[state=on]:shadow-sm"
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
