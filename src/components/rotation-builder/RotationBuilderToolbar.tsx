import { Shield, Sword, User } from 'lucide-react';

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
    <div className="border-border bg-background flex shrink-0 items-center justify-between gap-3 border-b px-4">
      <ToggleGroup
        type="single"
        value={selectedTab}
        onValueChange={(value) => {
          if (value) setSelectedTab(value);
        }}
        className="bg-muted/60 border-border grid h-auto grid-cols-3 gap-1 rounded-lg border p-1"
      >
        <ToggleGroupItem
          value="team"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-9 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
        >
          <User size={16} /> Team
        </ToggleGroupItem>
        <ToggleGroupItem
          value="enemy"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-9 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
        >
          <Shield size={16} /> Enemy
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rotation"
          className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-9 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
        >
          <Sword size={16} /> Rotation
        </ToggleGroupItem>
      </ToggleGroup>
      <ButtonGroup>
        <SaveRotationButton />
        <CalculateRotationButton />
      </ButtonGroup>
    </div>
  );
}
