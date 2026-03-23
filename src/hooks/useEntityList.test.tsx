import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEntityList } from './useEntityList';

vi.mock('@/services/game-data', async () => {
  const actual = await vi.importActual('@/services/game-data');
  return {
    ...actual,
    listEntities: vi.fn(),
  };
});

const { EntityType, listEntities } = await import('@/services/game-data');
const mockListEntities = vi.mocked(listEntities);

describe('useEntityList', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense>{children}</Suspense>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('fetches one shared entity catalog and filters lists client-side', async () => {
    mockListEntities.mockResolvedValue([
      {
        id: 1,
        name: 'Aalto',
        type: EntityType.CHARACTER,
        iconUrl: '/characters/aalto.png',
        weaponType: 'pistols',
        rank: 4,
        attribute: 'aero',
        gameId: undefined,
        description: undefined,
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Rover',
        type: EntityType.CHARACTER,
        iconUrl: '/characters/rover.png',
        weaponType: 'sword',
        rank: 5,
        attribute: 'spectro',
        gameId: undefined,
        description: undefined,
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 10,
        name: 'Pistol A',
        type: EntityType.WEAPON,
        iconUrl: '/weapons/pistol-a.png',
        weaponType: 'pistols',
        rank: 4,
        attribute: undefined,
        gameId: undefined,
        description: undefined,
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 11,
        name: 'Sword A',
        type: EntityType.WEAPON,
        iconUrl: '/weapons/sword-a.png',
        weaponType: 'sword',
        rank: 5,
        attribute: undefined,
        gameId: undefined,
        description: undefined,
        echoSetIds: undefined,
        cost: undefined,
        setBonusThresholds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 100,
        name: 'Echo A',
        type: EntityType.ECHO,
        iconUrl: '/echoes/echo-a.png',
        cost: 3,
        echoSetIds: [1],
        rank: undefined,
        weaponType: undefined,
        attribute: undefined,
        gameId: undefined,
        description: undefined,
        setBonusThresholds: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 200,
        name: 'Set A',
        type: EntityType.ECHO_SET,
        iconUrl: '/echo-sets/set-a.png',
        gameId: 9001,
        setBonusThresholds: [2, 5],
        rank: undefined,
        weaponType: undefined,
        attribute: undefined,
        echoSetIds: undefined,
        cost: undefined,
        description: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { result } = renderHook(
      () => ({
        characters: useEntityList({ entityType: EntityType.CHARACTER }),
        weapons: useEntityList({ entityType: EntityType.WEAPON }),
        echoes: useEntityList({ entityType: EntityType.ECHO }),
        echoSets: useEntityList({ entityType: EntityType.ECHO_SET }),
        allEntities: useEntityList({ entityType: undefined }),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.characters.data).toHaveLength(2);
      expect(result.current.weapons.data).toHaveLength(2);
      expect(result.current.echoes.data).toHaveLength(1);
      expect(result.current.echoSets.data).toHaveLength(1);
      expect(result.current.allEntities.data).toHaveLength(6);
    });

    expect(result.current.allEntities.data.map((entity) => entity.iconUrl)).toEqual([
      '/characters/aalto.png',
      '/characters/rover.png',
      '/weapons/pistol-a.png',
      '/weapons/sword-a.png',
      '/echoes/echo-a.png',
      '/echo-sets/set-a.png',
    ]);
    expect(mockListEntities).toHaveBeenCalledTimes(1);
  });
});
