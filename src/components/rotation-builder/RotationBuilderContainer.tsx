import { Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';

import { EnemyContainer } from '@/components/rotation-builder/enemy/EnemyContainer';
import { RotationResultDisplay } from '@/components/rotation-builder/results/RotationResultDisplay';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

export const RotationBuilderContainer = () => {
  const [selectedTab, setSelectedTab] = useState('team');

  const { data: result, isPlaceholderData } = useRotationCalculation();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <RotationBuilderToolbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {result && (
        <div className="animate-in fade-in slide-in-from-top-4 shrink-0 duration-500">
          <RotationResultDisplay result={result} isStale={isPlaceholderData} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {selectedTab === 'team' && (
          <div className="h-full overflow-y-auto">
            <Suspense
              fallback={
                <div className="text-muted-foreground animate-in fade-in flex flex-col items-center justify-center p-20 duration-500">
                  <Loader2 className="text-primary mb-4 h-10 w-10 animate-spin" />
                  <p className="text-lg">Loading character data...</p>
                </div>
              }
            >
              <TeamContainer />
            </Suspense>
          </div>
        )}
        {selectedTab === 'enemy' && (
          <div className="h-full overflow-y-auto">
            <EnemyContainer />
          </div>
        )}
        {selectedTab === 'rotation' && (
          <div className="h-full min-h-0 overflow-hidden">
            <RotationBuilder />
          </div>
        )}
      </div>
    </div>
  );
};
