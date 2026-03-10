import { createFileRoute } from '@tanstack/react-router';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreHydrated } from '@/store';

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  if (!hydrated) {
    return <Skeleton className="h-full w-full" />;
  }
  return (
    <ErrorBoundary>
      <RotationBuilderContainer />
    </ErrorBoundary>
  );
};

export const Route = createFileRoute('/')({ component: RotationBuilderRoute });
