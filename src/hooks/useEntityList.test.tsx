import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WeaponType } from '@/types';

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
    mockListEntities.mockResolvedValue({
      characters: [
        {
          id: 1,
          name: 'Aalto',
          weaponType: WeaponType.PISTOLS,
          rarity: 4,
          attribute: 'aero',
        },
        {
          id: 2,
          name: 'Rover',
          weaponType: WeaponType.SWORD,
          rarity: 5,
          attribute: 'spectro',
        },
      ],
      weapons: [
        { id: 10, name: 'Pistol A', weaponType: WeaponType.PISTOLS, rarity: 4 },
        { id: 11, name: 'Sword A', weaponType: WeaponType.SWORD, rarity: 5 },
      ],
      echoes: [{ id: 100, name: 'Echo A', cost: 3, sets: [1] }],
      echoSets: [{ id: 200, gameId: 9001, name: 'Set A', tiers: [2, 5] }],
    });

    const { result } = renderHook(
      () => ({
        characters: useEntityList({
          entityType: EntityType.CHARACTER,
          weaponType: WeaponType.SWORD,
        }),
        weapons: useEntityList({
          entityType: EntityType.WEAPON,
          weaponType: WeaponType.PISTOLS,
        }),
        echoes: useEntityList({ entityType: EntityType.ECHO }),
        echoSets: useEntityList({ entityType: EntityType.ECHO_SET }),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.characters.data).toHaveLength(1);
      expect(result.current.weapons.data).toHaveLength(1);
      expect(result.current.echoes.data).toHaveLength(1);
      expect(result.current.echoSets.data).toHaveLength(1);
    });

    expect(result.current.characters.data[0]?.name).toBe('Rover');
    expect(result.current.weapons.data[0]?.name).toBe('Pistol A');
    expect(mockListEntities).toHaveBeenCalledTimes(1);
  });
});
