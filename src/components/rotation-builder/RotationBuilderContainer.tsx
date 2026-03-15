import { useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotationResultContainer } from '@/components/rotation-builder/results/RotationResultContainer';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Stack } from '../ui/layout';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

interface RotationBuilderContainerProperties {
  initialTab?: 'team' | 'rotation' | 'results';
}

export const RotationBuilderContainer = ({
  initialTab = 'team',
}: RotationBuilderContainerProperties) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const { data: result } = useRotationCalculation();

  return (
    <Stack className="h-full min-h-0">
      <RotationBuilderToolbar
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {selectedTab === 'team' && <TeamContainer />}
      {selectedTab === 'rotation' && <RotationBuilder />}
      {selectedTab === 'results' && result && (
        <ErrorBoundary>
          <RotationResultContainer />
        </ErrorBoundary>
      )}
    </Stack>
  );
};
