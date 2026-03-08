import { useState } from 'react';

import { RotationResultContainer } from '@/components/rotation-builder/results/RotationResultContainer';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Stack } from '../ui/layout';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

export const RotationBuilderContainer = () => {
  const [selectedTab, setSelectedTab] = useState('team');
  const { data: result, isPlaceholderData } = useRotationCalculation();
  return (
    <Stack className="h-full min-h-0">
      <RotationBuilderToolbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {selectedTab === 'team' && <TeamContainer />}
      {selectedTab === 'rotation' && <RotationBuilder />}
      {selectedTab === 'results' && result && (
        <RotationResultContainer result={result} isStale={isPlaceholderData} />
      )}
    </Stack>
  );
};
