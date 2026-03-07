import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/game-data', () => ({
  getIcons: vi.fn(),
}));

const { getIcons } = await import('@/services/game-data');
const mockGetIcons = vi.mocked(getIcons);

const { useCapabilityIcon, useEntityIcon } = await import('./useIcons');

const wrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

describe('useCapabilityIcon', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockGetIcons.mockClear();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('fetches the icon when no iconUrl option is provided', () => {
    mockGetIcons.mockResolvedValue([
      { id: 1, type: 'capability', iconUrl: 'http://example.com/icon.png' },
    ]);

    renderHook(() => useCapabilityIcon(1), { wrapper: wrapper(queryClient) });

    expect(mockGetIcons).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when enabled: false is passed', () => {
    renderHook(() => useCapabilityIcon(1, { enabled: false }), {
      wrapper: wrapper(queryClient),
    });

    expect(mockGetIcons).not.toHaveBeenCalled();
  });
});

describe('useEntityIcon', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockGetIcons.mockClear();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('fetches the icon when no options are provided', () => {
    mockGetIcons.mockResolvedValue([
      { id: 1001, type: 'entity', iconUrl: 'http://example.com/char.png' },
    ]);

    renderHook(() => useEntityIcon(1001), { wrapper: wrapper(queryClient) });

    expect(mockGetIcons).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when enabled: false is passed', () => {
    renderHook(() => useEntityIcon(1001, { enabled: false }), {
      wrapper: wrapper(queryClient),
    });

    expect(mockGetIcons).not.toHaveBeenCalled();
  });
});
