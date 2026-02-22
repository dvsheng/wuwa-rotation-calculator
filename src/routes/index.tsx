import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Shield, Sword, User } from 'lucide-react';
import { Suspense, useState } from 'react';

import { EnemyContainer } from '@/components/enemy/EnemyContainer';
import { SaveRotationButton } from '@/components/library/SaveRotationButton';
import { CalculateRotationButton } from '@/components/results/CalculateRotationButton';
import { RotationResultDisplay } from '@/components/results/RotationResultDisplay';
import { RotationBuilder } from '@/components/rotation/RotationBuilder';
import { TeamContainer } from '@/components/team/TeamContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useStore } from '@/store';

function IndexPage() {
  const [selectedTab, setSelectedTab] = useState('team');
  const [showResult, setShowResult] = useState(false);
  const { data: result, isPlaceholderData } = useRotationCalculation();
  const isCalculateButtonVisible = useStore((state) => state.attacks.length > 0);

  return (
    <Tabs
      defaultValue="team"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <TabsList className="bg-muted/60 border-border flex h-auto flex-wrap items-stretch justify-start gap-1 rounded-lg border p-1">
            <TabsTrigger
              value="team"
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground flex h-10 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=active]:shadow-sm"
            >
              <User size={16} /> Team
            </TabsTrigger>
            <TabsTrigger
              value="enemy"
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground flex h-10 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=active]:shadow-sm"
            >
              <Shield size={16} /> Enemy
            </TabsTrigger>
            <TabsTrigger
              value="rotation"
              className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground flex h-10 items-center justify-start gap-2 rounded-md border border-transparent px-4 font-medium transition data-[state=active]:shadow-sm"
            >
              <Sword size={16} /> Rotation
            </TabsTrigger>
          </TabsList>
        </div>

        {isCalculateButtonVisible && (
          <div className="flex items-center gap-2">
            <SaveRotationButton />
            <CalculateRotationButton onCalculated={() => setShowResult(true)} />
          </div>
        )}
      </div>

      {showResult && result && (
        <div className="animate-in fade-in slide-in-from-top-4 mb-8 duration-500">
          <RotationResultDisplay result={result} isStale={isPlaceholderData} />
        </div>
      )}

      <TabsContent value="team" className="m-0 space-y-4 focus-visible:outline-none">
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

      <TabsContent value="enemy" className="m-0 space-y-4 focus-visible:outline-none">
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
}

export const Route = createFileRoute('/')({ component: IndexPage });
