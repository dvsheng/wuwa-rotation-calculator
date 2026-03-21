import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { LoadingSpinnerContainer } from '@/components/common/LoadingSpinnerContainer';
import { RotationBuilderContainer } from '@/components/rotation-builder/RotationBuilderContainer';
import { useRotationCalculation } from '@/hooks/useRotationCalculation';
import { useTeamAttackInstances } from '@/hooks/useTeamAttackInstances';
import { getRotationById } from '@/services/rotation-library';
import { useStore, useStoreHydrated } from '@/store';

const createSearchSchema = z.object({
  tab: z.enum(['team', 'rotation', 'results']).optional(),
  rotationId: z.coerce.number().int().positive().optional(),
});

interface RotationRouteLoaderProperties {
  initialTab: 'team' | 'rotation' | 'results';
  rotationId?: number;
}

const RotationRouteLoader = ({
  initialTab,
  rotationId,
}: RotationRouteLoaderProperties) => {
  const navigate = useNavigate({ from: '/create' });
  const setTeam = useStore((state) => state.setTeam);
  const setEnemy = useStore((state) => state.setEnemy);
  const setAttacks = useStore((state) => state.setAttacks);
  const setBuffs = useStore((state) => state.setBuffs);
  const queryClient = useQueryClient();
  const { isLoading: isLoadingTeamAttacks } = useTeamAttackInstances();
  const { refetch } = useRotationCalculation();
  const [isBootstrapping, setIsBootstrapping] = useState(rotationId !== undefined);
  const [syncedRotationId, setSyncedRotationId] = useState<number | undefined>();
  const [calculatedRotationId, setCalculatedRotationId] = useState<
    number | undefined
  >();
  const syncedRotationIdReference = useRef<number | undefined>(undefined);
  const notifiedErrorKeyReference = useRef<string | undefined>(undefined);
  const {
    data: rotation,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['rotation', rotationId],
    queryFn: () => getRotationById({ data: { id: rotationId! } }),
    enabled: rotationId !== undefined,
    retry: false,
  });

  useEffect(() => {
    if (rotationId === undefined) {
      syncedRotationIdReference.current = undefined;
      setSyncedRotationId(undefined);
      setCalculatedRotationId(undefined);
      setIsBootstrapping(false);
      return;
    }

    queryClient.removeQueries({
      queryKey: ['rotation-calculation'],
    });
    syncedRotationIdReference.current = undefined;
    setSyncedRotationId(undefined);
    setCalculatedRotationId(undefined);
    setIsBootstrapping(true);
  }, [queryClient, rotationId]);

  useEffect(() => {
    if (!rotation || syncedRotationIdReference.current === rotation.id) {
      return;
    }

    queryClient.removeQueries({
      queryKey: ['rotation-calculation'],
    });
    setTeam(rotation.data.team);
    setEnemy(rotation.data.enemy);
    setAttacks(rotation.data.attacks);
    setBuffs(rotation.data.buffs);
    syncedRotationIdReference.current = rotation.id;
    setSyncedRotationId(rotation.id);
    setCalculatedRotationId(undefined);
    setIsBootstrapping(true);
  }, [queryClient, rotation, setAttacks, setBuffs, setEnemy, setTeam]);

  useEffect(() => {
    if (rotationId === undefined || !rotation) {
      return;
    }

    if (syncedRotationId !== rotation.id || isLoadingTeamAttacks) {
      return;
    }

    if (calculatedRotationId === rotation.id) {
      setIsBootstrapping(false);
      return;
    }

    let isCancelled = false;

    const calculateLoadedRotation = async () => {
      try {
        const result = await refetch();
        if (isCancelled) {
          return;
        }

        if (result.isError) {
          toast.warning(`Loaded rotation: ${rotation.name}`, {
            description:
              'Rotation data loaded, but damage results could not be calculated.',
          });
        } else {
          toast.success(`Loaded rotation: ${rotation.name}`);
        }
      } catch {
        if (!isCancelled) {
          toast.warning(`Loaded rotation: ${rotation.name}`, {
            description:
              'Rotation data loaded, but damage results could not be calculated.',
          });
        }
      } finally {
        if (!isCancelled) {
          setCalculatedRotationId(rotation.id);
          setIsBootstrapping(false);
        }
      }
    };

    void calculateLoadedRotation();

    return () => {
      isCancelled = true;
    };
  }, [
    calculatedRotationId,
    isLoadingTeamAttacks,
    refetch,
    rotation,
    rotationId,
    syncedRotationId,
  ]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorKey = `${rotationId}:${errorMessage}`;
    if (notifiedErrorKeyReference.current === errorKey) {
      setIsBootstrapping(false);
      return;
    }

    toast.error('Failed to load rotation.', {
      description: errorMessage,
    });
    notifiedErrorKeyReference.current = errorKey;
    setIsBootstrapping(false);
  }, [error, rotationId]);

  useEffect(() => {
    if (
      rotationId === undefined ||
      syncedRotationId === undefined ||
      calculatedRotationId !== syncedRotationId
    ) {
      return;
    }

    void navigate({
      replace: true,
      search: (previous) => ({
        ...previous,
        rotationId: undefined,
      }),
    });
  }, [calculatedRotationId, navigate, rotationId, syncedRotationId]);

  if (rotationId !== undefined && (isFetching || isBootstrapping)) {
    return (
      <LoadingSpinnerContainer message="Loading Rotation Builder" spinnerSize={40} />
    );
  }

  return <RotationBuilderContainer initialTab={initialTab} />;
};

const RotationBuilderRoute = () => {
  const hydrated = useStoreHydrated();
  const searchParameters = Route.useSearch();
  if (!hydrated) {
    return (
      <LoadingSpinnerContainer message="Loading Rotation Builder" spinnerSize={40} />
    );
  }
  return (
    <RotationRouteLoader
      initialTab={searchParameters.tab ?? 'team'}
      rotationId={searchParameters.rotationId}
    />
  );
};

export const Route = createFileRoute('/create')({
  validateSearch: createSearchSchema,
  ssr: false,
  component: RotationBuilderRoute,
});
