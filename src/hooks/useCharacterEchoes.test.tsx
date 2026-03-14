import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ECHO_SUBSTAT_VALUES,
  EchoCost,
  EchoMainStatOption,
  EchoSubstatOption,
} from '@/schemas/echo';
import type { GetEchoStatsResponse } from '@/services/echo-stat-approximator/types';
import { useStore } from '@/store';

vi.mock('@/services/echo-stat-approximator/get-echo-stats.function', () => ({
  getEchoStats: vi.fn(),
}));

const { getEchoStats } =
  await import('@/services/echo-stat-approximator/get-echo-stats.function');
const { useCharacterEchoes } = await import('./useCharacterEchoes');

const mockGetEchoStats = vi.mocked(getEchoStats);

const createEchoResponse = (
  mainStatType: (typeof EchoMainStatOption)[keyof typeof EchoMainStatOption],
): GetEchoStatsResponse => ({
  echoes: [
    {
      cost: EchoCost.FOUR,
      mainStatType,
      substats: [
        {
          stat: EchoSubstatOption.CRIT_RATE,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][3],
        },
        {
          stat: EchoSubstatOption.CRIT_DMG,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][3],
        },
        {
          stat: EchoSubstatOption.ATK_PERCENT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][3],
        },
        {
          stat: EchoSubstatOption.ENERGY_REGEN,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ENERGY_REGEN][3],
        },
        {
          stat: EchoSubstatOption.ATK_FLAT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][3],
        },
      ],
    },
    {
      cost: EchoCost.THREE,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        {
          stat: EchoSubstatOption.CRIT_RATE,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][3],
        },
        {
          stat: EchoSubstatOption.CRIT_DMG,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][3],
        },
        {
          stat: EchoSubstatOption.ATK_PERCENT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][3],
        },
        {
          stat: EchoSubstatOption.ENERGY_REGEN,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ENERGY_REGEN][3],
        },
        {
          stat: EchoSubstatOption.ATK_FLAT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][3],
        },
      ],
    },
    {
      cost: EchoCost.THREE,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        {
          stat: EchoSubstatOption.CRIT_RATE,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][3],
        },
        {
          stat: EchoSubstatOption.CRIT_DMG,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][3],
        },
        {
          stat: EchoSubstatOption.ATK_PERCENT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][3],
        },
        {
          stat: EchoSubstatOption.ENERGY_REGEN,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ENERGY_REGEN][3],
        },
        {
          stat: EchoSubstatOption.ATK_FLAT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][3],
        },
      ],
    },
    {
      cost: EchoCost.ONE,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        {
          stat: EchoSubstatOption.CRIT_RATE,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][3],
        },
        {
          stat: EchoSubstatOption.CRIT_DMG,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][3],
        },
        {
          stat: EchoSubstatOption.ATK_PERCENT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][3],
        },
        {
          stat: EchoSubstatOption.ENERGY_REGEN,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ENERGY_REGEN][3],
        },
        {
          stat: EchoSubstatOption.ATK_FLAT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][3],
        },
      ],
    },
    {
      cost: EchoCost.ONE,
      mainStatType: EchoMainStatOption.ATK_PERCENT,
      substats: [
        {
          stat: EchoSubstatOption.CRIT_RATE,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_RATE][3],
        },
        {
          stat: EchoSubstatOption.CRIT_DMG,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.CRIT_DMG][3],
        },
        {
          stat: EchoSubstatOption.ATK_PERCENT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_PERCENT][3],
        },
        {
          stat: EchoSubstatOption.ENERGY_REGEN,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ENERGY_REGEN][3],
        },
        {
          stat: EchoSubstatOption.ATK_FLAT,
          value: ECHO_SUBSTAT_VALUES[EchoSubstatOption.ATK_FLAT][3],
        },
      ],
    },
  ],
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const wrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe('useCharacterEchoes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('updates the selected character echo stats from the service response', async () => {
    useStore.getState().setCharacter(0, 484);
    const response = createEchoResponse(EchoMainStatOption.CRIT_RATE);
    mockGetEchoStats.mockResolvedValue(response);

    const { result } = renderHook(() => useCharacterEchoes(0), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.syncCharacterEchoes(484);
    });

    expect(mockGetEchoStats).toHaveBeenCalledWith({ data: { characterId: 484 } });
    expect(useStore.getState().team[0].echoStats).toEqual(response.echoes);
  });

  it('ignores stale responses when the character changes again before the request resolves', async () => {
    const firstRequest = deferred<ReturnType<typeof createEchoResponse>>();
    const secondRequest = deferred<ReturnType<typeof createEchoResponse>>();
    mockGetEchoStats
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result } = renderHook(() => useCharacterEchoes(0), {
      wrapper: wrapper(queryClient),
    });

    useStore.getState().setCharacter(0, 484);
    const initialEchoStats = useStore.getState().team[0].echoStats;

    let firstPromise!: Promise<void>;
    let secondPromise!: Promise<void>;

    await act(async () => {
      firstPromise = result.current.syncCharacterEchoes(484);
      useStore.getState().setCharacter(0, 463);
      secondPromise = result.current.syncCharacterEchoes(463);

      firstRequest.resolve(createEchoResponse(EchoMainStatOption.CRIT_RATE));
      secondRequest.resolve(createEchoResponse(EchoMainStatOption.CRIT_DMG));

      await Promise.all([firstPromise, secondPromise]);
    });

    expect(useStore.getState().team[0].id).toBe(463);
    expect(useStore.getState().team[0].echoStats).not.toEqual(initialEchoStats);
    expect(useStore.getState().team[0].echoStats[0]?.mainStatType).toBe(
      EchoMainStatOption.CRIT_DMG,
    );
  });
});
