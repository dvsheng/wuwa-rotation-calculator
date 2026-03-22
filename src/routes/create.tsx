import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { getRotationCalculationQueryOptions } from '@/hooks/useRotationCalculation';
import { getRotationById } from '@/services/rotation-library';
import { useStore } from '@/store';
import { rotationBuilderTabs } from '@/store/rotationBuilderUiSlice';

const createSearchSchema = z.object({
  tab: z.enum(rotationBuilderTabs).optional(),
  rotationId: z.coerce.number().int().positive().optional(),
});

/**
 * Pre-populates the Zustand store for the Rotation Builder before load
 * @returns the Rotation Builder with it's store populated
 */
const RotationRouteComponent = () => {
  const { rotation } = Route.useLoaderData();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: '/create' });
  const setActiveTab = useStore((store) => store.setActiveTab);
  const setTeam = useStore((store) => store.setTeam);
  const setEnemy = useStore((store) => store.setEnemy);
  const setAttacks = useStore((store) => store.setAttacks);
  const setBuffs = useStore((store) => store.setBuffs);

  useEffect(() => {
    if (tab) setActiveTab(tab);
    if (rotation) {
      setTeam(rotation.data.team);
      setEnemy(rotation.data.enemy);
      setAttacks(rotation.data.attacks);
      setBuffs(rotation.data.buffs);
    }
    // Remove query parameters from path to prevent reloading the rotation data,
    // which may potentially overwrite user changes, on page refresh
    navigate({
      replace: true,
      search: (previous) => ({ ...previous, rotationId: undefined, tab: undefined }),
    });
  });

  return <RotationBuilderContainer />;
};

export const Route = createFileRoute('/create')({
  validateSearch: createSearchSchema,
  ssr: false,
  /**
   * Populate the query client with rotation results when navigating to the page with
   * a rotationId
   */
  loaderDeps: ({ search: { rotationId } }) => ({ rotationId }),
  loader: async ({ context: { queryClient }, deps: { rotationId } }) => {
    if (rotationId === undefined) return { rotation: undefined };

    let rotation;
    try {
      rotation = await queryClient.fetchQuery({
        queryKey: ['rotation', rotationId],
        queryFn: () => getRotationById({ data: { id: rotationId } }),
      });
    } catch (error) {
      toast.error('Failed to load rotation.', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return { rotation: undefined };
    }

    try {
      await queryClient.fetchQuery(getRotationCalculationQueryOptions(rotation.data));
    } catch {
      toast.warning(`Loaded rotation: ${rotation.name}`, {
        description:
          'Rotation data loaded, but damage results could not be calculated.',
      });
    }
    toast.success(`Loaded rotation: ${rotation.name}`);

    return { rotation };
  },
  pendingComponent: () => (
    <LoadingSpinnerContainer message="Loading Rotation Builder" spinnerSize={40} />
  ),
  component: RotationRouteComponent,
});
