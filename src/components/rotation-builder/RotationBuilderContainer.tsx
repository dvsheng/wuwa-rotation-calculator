import { Suspense, lazy, useEffect, useState } from 'react';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { TeamContainer } from '@/components/rotation-builder/team/TeamContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useStore, useStoreHydrated } from '@/store';
import { rotationBuilderTabs } from '@/store/rotationBuilderUiSlice';

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

export const RotationBuilderContainer = () => {
  const hydrated = useStoreHydrated();
  const selectedTab = useStore((state) => state.activeTab);
  const setSelectedTab = useStore((state) => state.setActiveTab);
  const { data: result, isPlaceholderData } = useRotationCalculation();
  const effectiveTab = selectedTab === 'results' && !result ? 'rotation' : selectedTab;
  const [animState, setAnimState] = useState({ tab: effectiveTab, enterClass: '' });

  // Lazy load the RotationResultContainer if results are present
  useEffect(() => {
    if (!result) {
      return;
    }
    loadRotationResultContainer();
  }, [result]);

  if (animState.tab !== effectiveTab) {
    const previousIndex = rotationBuilderTabs.indexOf(animState.tab);
    const currentIndex = rotationBuilderTabs.indexOf(effectiveTab);
    setAnimState({
      tab: effectiveTab,
      enterClass:
        currentIndex >= previousIndex ? 'slide-left-enter' : 'slide-right-enter',
    });
  }

  if (!hydrated) {
    return (
      <LoadingSpinnerContainer message="Loading Rotation Builder" spinnerSize={40} />
    );
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
                message="Loading rotation results..."
                spinnerSize={40}
              />
            }
          >
            <LazyRotationResultContainer
              data={result}
              isPlaceholderData={isPlaceholderData}
            />
          </Suspense>
        )}
      </div>
    </Stack>
  );
};
