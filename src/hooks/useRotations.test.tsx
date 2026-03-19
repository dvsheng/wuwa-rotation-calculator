import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRotations } from './useRotations';

vi.mock('@/services/rotation-library', () => ({
  listRotations: vi.fn(),
}));

const { listRotations: mockListRotations } =
  await import('@/services/rotation-library');

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('useRotations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes scope, pagination, and normalized character filters in the query request', async () => {
    const queryClient = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.mocked(mockListRotations).mockResolvedValue({
      items: [],
      total: 0,
      offset: 0,
      limit: 20,
    });

    renderHook(
      () =>
        useRotations({
          scope: 'public',
          offset: 0,
          limit: 20,
          characterIds: [8, 2, 8],
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockListRotations).toHaveBeenCalledWith({
        data: {
          scope: 'public',
          offset: 0,
          limit: 20,
          characterIds: [2, 8],
        },
      });
    });
  });

  it('keeps previous page data visible while the next page loads', async () => {
    const queryClient = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveNextPage:
      | ((value: {
          items: Array<{ id: number; name: string }>;
          total: number;
          offset: number;
          limit: number;
        }) => void)
      | undefined;

    vi.mocked(mockListRotations)
      .mockResolvedValueOnce({
        items: [{ id: 1, name: 'First page' }] as any,
        total: 40,
        offset: 0,
        limit: 20,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextPage = resolve as typeof resolveNextPage;
          }),
      );

    const { result, rerender } = renderHook(
      ({ offset }) =>
        useRotations({
          scope: 'public',
          offset,
          limit: 20,
          characterIds: [],
        }),
      {
        initialProps: { offset: 0 },
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.data.items).toHaveLength(1);
    });

    rerender({ offset: 20 });

    await waitFor(() => {
      expect(result.current.isPreviousData).toBe(true);
    });
    expect(result.current.data.items).toEqual([{ id: 1, name: 'First page' }]);

    resolveNextPage?.({
      items: [{ id: 2, name: 'Second page' }] as any,
      total: 40,
      offset: 20,
      limit: 20,
    });

    await waitFor(() => {
      expect(result.current.data.items).toEqual([{ id: 2, name: 'Second page' }]);
    });
  });
});
