import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { Stack } from '@/components/ui/layout';
import { useStoreHydrated } from '@/store';

const createSearchSchema = z.object({
  tab: z.enum(['team', 'rotation', 'results']).optional(),
});

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  const searchParameters = Route.useSearch();
  if (!hydrated) {
    return (
      <Stack align="center" justify="center" fullHeight fullWidth>
        <Loader2 className="animate-spin" size={80}></Loader2>
        Loading Rotation Builder
      </Stack>
    );
  }
  return <RotationBuilderContainer initialTab={searchParameters.tab ?? 'team'} />;
};

export const Route = createFileRoute('/create')({
  validateSearch: createSearchSchema,
  component: RotationBuilderRoute,
});
