import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEntities, useEntityCapabilities } from './useEntities';

vi.mock('@/services/game-data', async () => {
  const actual = await vi.importActual('@/services/game-data');
  return {
    ...actual,
    listEntities: vi.fn(),
  };
});

vi.mock('@/services/game-data/list-entity-capabilities.function', () => ({
  listEntityCapabilities: vi.fn(),
}));

const { EntityType, listEntities } = await import('@/services/game-data');
const { listEntityCapabilities } =
  await import('@/services/game-data/list-entity-capabilities.function');

const mockListEntities = vi.mocked(listEntities);
const mockListEntityCapabilities = vi.mocked(listEntityCapabilities);

describe('useEntities', () => {
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
        weaponType: 'Pistols',
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
        weaponType: 'Sword',
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
        weaponType: 'Pistols',
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
        weaponType: 'Sword',
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
    ] as any);

    const { result } = renderHook(
      () => ({
        characters: useEntities({ entityType: EntityType.CHARACTER }),
        weapons: useEntities({ entityType: EntityType.WEAPON }),
        echoes: useEntities({ entityType: EntityType.ECHO }),
        echoSets: useEntities({ entityType: EntityType.ECHO_SET }),
        search: useEntities({ search: 'rov' }),
        allEntities: useEntities({}),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.characters.data).toHaveLength(2);
      expect(result.current.weapons.data).toHaveLength(2);
      expect(result.current.echoes.data).toHaveLength(1);
      expect(result.current.echoSets.data).toHaveLength(1);
      expect(result.current.search.data).toHaveLength(1);
      expect(result.current.allEntities.data).toHaveLength(6);
    });

    expect(result.current.search.data[0]?.name).toBe('Rover');
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

  it('fetches capabilities for a single entity', async () => {
    mockListEntityCapabilities.mockResolvedValue([
      {
        id: 501,
        name: 'Strike',
        parentName: 'Normal Attack',
        originType: 'Normal Attack',
        skillId: 12,
        entityId: 42,
        capabilityJson: {
          type: 'attack',
          damageInstances: [],
        },
      },
    ] as any);

    const { result } = renderHook(() => useEntityCapabilities(42), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.data[0]?.id).toBe(501);
    expect(mockListEntityCapabilities).toHaveBeenCalledWith({
      data: { id: 42 },
    });
  });
});
