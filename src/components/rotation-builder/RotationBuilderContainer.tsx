import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { DataLoadFailed } from '@/components/common/DataLoadFailed';
import { RotationResultContainer } from '@/components/rotation-builder/results/RotationResultContainer';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Stack } from '../ui/layout';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

interface RotationBuilderContainerProperties {
  initialTab?: 'team' | 'rotation' | 'results';
}

const TAB_ORDER = ['team', 'rotation', 'results'] as const;

export const RotationBuilderContainer = ({
  initialTab = 'team',
}: RotationBuilderContainerProperties) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const { data: result } = useRotationCalculation();
  const effectiveTab = selectedTab === 'results' && !result ? 'rotation' : selectedTab;

  const [animState, setAnimState] = useState({ tab: effectiveTab, enterClass: '' });
  if (animState.tab !== effectiveTab) {
    const previousIndex = TAB_ORDER.indexOf(animState.tab);
    const currentIndex = TAB_ORDER.indexOf(effectiveTab);
    setAnimState({
      tab: effectiveTab,
      enterClass:
        currentIndex >= previousIndex ? 'slide-left-enter' : 'slide-right-enter',
    });
  }

  return (
    <Stack className="h-full min-h-0">
      <RotationBuilderToolbar
        selectedTab={effectiveTab}
        setSelectedTab={setSelectedTab}
      />
      <div
        key={effectiveTab}
        className={`flex min-h-0 flex-1 flex-col ${animState.enterClass}`}
      >
        {effectiveTab === 'team' && (
          <ErrorBoundary fallback={<DataLoadFailed />}>
            <TeamContainer />
          </ErrorBoundary>
        )}
        {effectiveTab === 'rotation' && <RotationBuilder />}
        {effectiveTab === 'results' && result && <RotationResultContainer />}
      </div>
    </Stack>
  );
};
