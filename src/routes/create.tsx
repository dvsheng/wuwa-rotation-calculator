import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { useStoreHydrated } from '@/store';

const createSearchSchema = z.object({
  tab: z.enum(['team', 'rotation', 'results']).optional(),
});

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  const searchParameters = Route.useSearch();
  if (!hydrated) {
    return (
      <LoadingSpinnerContainer message="Loading Rotation Builder" spinnerSize={40} />
    );
  }
  return <RotationBuilderContainer initialTab={searchParameters.tab ?? 'team'} />;
};

export const Route = createFileRoute('/create')({
  validateSearch: createSearchSchema,
  ssr: false,
  component: RotationBuilderRoute,
});
