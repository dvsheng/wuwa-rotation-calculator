import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { SavedRotation } from '@/schemas/library';

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('@/hooks/useRotationLibrary', () => ({
  useRotationLibrary: vi.fn(() => ({
    deleteRotation: vi.fn(),
    updateRotation: vi.fn(),
    createRotation: vi.fn(),
    rotations: [],
    isDeleting: false,
    isUpdating: false,
    isCreating: false,
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@/services/rotation-calculator/calculate-client-rotation-damage', () => ({
  calculateRotation: vi.fn(),
}));

vi.mock('@/components/common/EntityIcon', () => ({
  EntityIcon: () => {},
}));

vi.mock('@/components/common/AssetIcon', () => ({
  AttributeIcon: () => {},
}));

const { useUser: mockUseUser } = await import('@/hooks/useUser');

const mockRotation = {
  id: 1,
  ownerId: 'owner-123',
  name: 'Test Rotation',
  description: 'A test rotation',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  data: {
    team: [],
    enemy: {
      level: 90,
      resistances: {
        glacio: 10,
        fusion: 10,
        aero: 10,
        electro: 10,
        havoc: 10,
        spectro: 10,
        physical: 10,
      },
    },
    attacks: [],
    buffs: [],
  },
} as unknown as SavedRotation;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('SavedRotationCard', () => {
  it('hides delete and overwrite buttons when logged in as a different user', async () => {
    vi.mocked(mockUseUser).mockReturnValue({
      userId: 'other-user-456',
      username: 'other',
      isLoading: false,
    });

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.queryByText('Overwrite')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('hides delete and overwrite buttons when not logged in', async () => {
    vi.mocked(mockUseUser).mockReturnValue({
      userId: undefined,
      username: undefined,
      isLoading: false,
    });

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.queryByText('Overwrite')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('shows delete and overwrite buttons when logged in as the owner', async () => {
    vi.mocked(mockUseUser).mockReturnValue({
      userId: 'owner-123',
      username: 'owner',
      isLoading: false,
    });

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.getByText('Overwrite')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });
});
