import { Loader2, Shield, Sword, User } from 'lucide-react';
import { Suspense, useState } from 'react';

import { SaveRotationButton } from '@/components/builds/SaveRotationButton';
import { EnemyContainer } from '@/components/rotation-builder/enemy/EnemyContainer';
import { CalculateRotationButton } from '@/components/rotation-builder/results/CalculateRotationButton';
import { RotationResultDisplay } from '@/components/rotation-builder/results/RotationResultDisplay';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useStore } from '@/store';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';

export const RotationBuilderContainer = () => {
  const [selectedTab, setSelectedTab] = useState('team');
  const [showResult, setShowResult] = useState(false);
  const { data: result, isPlaceholderData } = useRotationCalculation();
  const isCalculateButtonVisible = useStore((state) => state.attacks.length > 0);

  return (
    <Tabs
      defaultValue="team"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full space-y-6"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-nowrap items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <ToggleGroup
            type="single"
            value={selectedTab}
            onValueChange={(value) => {
              if (value) setSelectedTab(value);
            }}
            className="bg-muted/60 border-border grid h-auto w-full grid-cols-3 items-stretch gap-1 rounded-lg border p-1"
          >
            <ToggleGroupItem
              value="team"
              className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-10 w-full items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
            >
              <User size={16} /> Team
            </ToggleGroupItem>
            <ToggleGroupItem
              value="enemy"
              className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-10 w-full items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
            >
              <Shield size={16} /> Enemy
            </ToggleGroupItem>
            <ToggleGroupItem
              value="rotation"
              className="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground flex h-10 w-full items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=on]:shadow-sm"
            >
              <Sword size={16} /> Rotation
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {isCalculateButtonVisible && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SaveRotationButton />
            <CalculateRotationButton onCalculated={() => setShowResult(true)} />
          </div>
        )}
      </div>

      {showResult && result && (
        <div className="animate-in fade-in slide-in-from-top-4 mx-auto mb-8 w-full max-w-6xl duration-500">
          <RotationResultDisplay result={result} isStale={isPlaceholderData} />
        </div>
      )}

      <TabsContent
        value="team"
        className="m-0 mx-auto w-full max-w-[94rem] space-y-4 focus-visible:outline-none"
      >
        <Suspense
          fallback={
            <div className="text-muted-foreground animate-in fade-in flex flex-col items-center justify-center p-20 duration-500">
              <Loader2 className="text-primary mb-4 h-10 w-10 animate-spin" />
              <p className="text-lg font-medium">Loading character data...</p>
            </div>
          }
        >
          <TeamContainer />
        </Suspense>
      </TabsContent>

      <TabsContent
        value="enemy"
        className="m-0 mx-auto w-full max-w-6xl space-y-4 focus-visible:outline-none"
      >
        <EnemyContainer />
      </TabsContent>

      <TabsContent
        value="rotation"
        className="m-0 space-y-4 focus-visible:outline-none"
      >
        <RotationBuilder />
      </TabsContent>
    </Tabs>
  );
};
