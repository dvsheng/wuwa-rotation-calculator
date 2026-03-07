import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotationData } from '@/schemas/library';

import { useRotationLibrary } from './useRotationLibrary';

vi.mock('@/services/rotation-library', () => ({
  listRotations: vi.fn(),
  createRotation: vi.fn(),
  updateRotation: vi.fn(),
  deleteRotation: vi.fn(),
}));

const {
  listRotations: mockListRotations,
  createRotation: mockCreateRotation,
  updateRotation: mockUpdateRotation,
  deleteRotation: mockDeleteRotation,
} = await import('@/services/rotation-library');

const mockRotationData = {
  team: [],
  enemy: {},
  attacks: [],
  buffs: [],
} as unknown as SavedRotationData;

describe('useRotationLibrary', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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

  it('loads rotations from the server', async () => {
    vi.mocked(mockListRotations).mockResolvedValue([
      {
        id: 1,
        name: 'My Rotation',
        data: mockRotationData,
        createdAt: new Date(100),
        updatedAt: new Date(200),
      },
    ]);

    const { result } = renderHook(() => useRotationLibrary(), { wrapper });

    await waitFor(() => {
      expect(result.current.rotations).toHaveLength(1);
    });

    expect(mockListRotations).toHaveBeenCalledWith();
  });

  it('passes input to create, update, and delete calls and invalidates cache', async () => {
    vi.mocked(mockListRotations).mockResolvedValue([]);
    vi.mocked(mockCreateRotation).mockResolvedValue({
      id: 1,
      name: 'Created',
      data: mockRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(100),
    });
    vi.mocked(mockUpdateRotation).mockResolvedValue({
      id: 1,
      name: 'Updated',
      data: mockRotationData,
      createdAt: new Date(100),
      updatedAt: new Date(200),
    });
    vi.mocked(mockDeleteRotation).mockResolvedValue({ success: true });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useRotationLibrary(), { wrapper });

    await waitFor(() => {
      expect(mockListRotations).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.createRotation({
        name: 'Created',
        data: mockRotationData,
      });
    });
    expect(mockCreateRotation).toHaveBeenCalledWith({
      data: { name: 'Created', data: mockRotationData },
    });

    await act(async () => {
      await result.current.updateRotation({
        id: 1,
        name: 'Updated',
      });
    });
    expect(mockUpdateRotation).toHaveBeenCalledWith({
      data: { id: 1, name: 'Updated' },
    });

    await act(async () => {
      await result.current.deleteRotation({
        id: 1,
      });
    });
    expect(mockDeleteRotation).toHaveBeenCalledWith({
      data: { id: 1 },
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['rotation-library'],
      });
    });
  });
});
