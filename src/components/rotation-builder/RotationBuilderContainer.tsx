import { Suspense, lazy, useEffect, useState } from 'react';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';

import { Stack } from '../ui/layout';

import { RotationBuilder } from './rotation-timeline/RotationTimelineBuilder';
import { RotationBuilderToolbar } from './RotationBuilderToolbar';

const loadRotationResultContainer = () =>
  import('@/components/rotation-builder/results/RotationResultContainer').then(
    (module) => ({
      default: module.RotationResultContainer,
    }),
  );

const LazyRotationResultContainer = lazy(loadRotationResultContainer);

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

  useEffect(() => {
    if (!result) {
      return;
    }
    loadRotationResultContainer();
  }, [result]);

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
        {effectiveTab === 'team' && <TeamContainer />}
        {effectiveTab === 'rotation' && <RotationBuilder />}
        {effectiveTab === 'results' && result && (
          <Suspense
            fallback={
              <LoadingSpinnerContainer
                message="Loading results..."
                className="bg-background/60 flex-1"
              />
            }
          >
            <LazyRotationResultContainer />
          </Suspense>
        )}
      </div>
    </Stack>
  );
};
