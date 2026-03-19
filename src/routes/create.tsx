import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreHydrated } from '@/store';

const createSearchSchema = z.object({
  tab: z.enum(['team', 'rotation', 'results']).optional(),
});

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  const searchParameters = Route.useSearch();
  if (!hydrated) {
    return (
      <Skeleton className="bg-background flex h-full w-full items-center justify-center">
        <Stack align="center">
          <Loader2 size={80}></Loader2>
          Loading Rotation Builder
        </Stack>
      </Skeleton>
    );
  }
  return <RotationBuilderContainer initialTab={searchParameters.tab ?? 'team'} />;
};

export const Route = createFileRoute('/create')({
  validateSearch: createSearchSchema,
  component: RotationBuilderRoute,
});
