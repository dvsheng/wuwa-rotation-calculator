import { useState } from 'react';

import { RotationResultDisplay } from '@/components/rotation-builder/results/RotationResultDisplay';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

export const RotationBuilderContainer = () => {
  const [selectedTab, setSelectedTab] = useState('team');

  const { data: result, isPlaceholderData } = useRotationCalculation();

  return (
    <>
      <RotationBuilderToolbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {result && (
        <div className="animate-in fade-in slide-in-from-top-4 shrink-0 duration-500">
          <RotationResultDisplay result={result} isStale={isPlaceholderData} />
        </div>
      )}

      {selectedTab === 'team' && <TeamContainer />}
      {selectedTab === 'rotation' && <RotationBuilder />}
    </>
  );
};
