import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotation } from '@/schemas/library';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
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

vi.mock('@/store', () => ({
  useStore: vi.fn(() => ({
    setTeam: vi.fn(),
    setEnemy: vi.fn(),
    setAttacks: vi.fn(),
    setBuffs: vi.fn(),
  })),
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

const { useSession: mockUseSession } = await import('@/lib/auth-client');
const { useNavigate: mockUseNavigate } = await import('@tanstack/react-router');
const { useStore: mockUseStore } = await import('@/store');
const { calculateRotation: mockCalculateRotation } =
  await import('@/services/rotation-calculator/calculate-client-rotation-damage');
const mockNavigate = vi.fn();
const mockSetTeam = vi.fn();
const mockSetEnemy = vi.fn();
const mockSetAttacks = vi.fn();
const mockSetBuffs = vi.fn();

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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockUseNavigate).mockReturnValue(mockNavigate);
    vi.mocked(mockUseStore).mockReturnValue({
      setTeam: mockSetTeam,
      setEnemy: mockSetEnemy,
      setAttacks: mockSetAttacks,
      setBuffs: mockSetBuffs,
    } as any);
    vi.mocked(mockCalculateRotation).mockResolvedValue({
      totalDamage: 123_456,
    } as any);
  });

  it('hides delete and overwrite buttons when logged in as a different user', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'other-user-123',
        },
      },
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.queryByText('Overwrite')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('hides delete and overwrite buttons when not logged in', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      undefined,
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.queryByText('Overwrite')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('keeps the overwrite button hidden when logged in as the owner', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'owner-123',
        },
      },
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    expect(screen.queryByText('Overwrite')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('loads the saved rotation, triggers calculation, and navigates home', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'owner-123',
        },
      },
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    expect(mockSetTeam).toHaveBeenCalledWith(mockRotation.data.team);
    expect(mockSetEnemy).toHaveBeenCalledWith(mockRotation.data.enemy);
    expect(mockSetAttacks).toHaveBeenCalledWith(mockRotation.data.attacks);
    expect(mockSetBuffs).toHaveBeenCalledWith(mockRotation.data.buffs);
    await waitFor(() => {
      expect(mockCalculateRotation).toHaveBeenCalledWith({
        data: mockRotation.data,
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/',
        search: { tab: 'results' },
      });
    });
  });
});
