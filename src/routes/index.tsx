import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreHydrated } from '@/store';

const homeSearchSchema = z.object({
  tab: z.enum(['team', 'rotation', 'results']).optional(),
});

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  const searchParameters = Route.useSearch();
  if (!hydrated) {
    return <Skeleton className="h-full w-full" />;
  }
  return (
    <ErrorBoundary>
      <RotationBuilderContainer initialTab={searchParameters.tab ?? 'team'} />
    </ErrorBoundary>
  );
};

export const Route = createFileRoute('/')({
  validateSearch: homeSearchSchema,
  component: RotationBuilderRoute,
});
