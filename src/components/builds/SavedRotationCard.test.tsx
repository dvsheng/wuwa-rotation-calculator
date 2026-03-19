import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedRotation } from '@/schemas/library';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/hooks/useLoadRotation', () => ({
  useLoadRotation: vi.fn(),
}));

vi.mock('@/hooks/useRotationMutations', () => ({
  useRotationMutations: vi.fn(),
}));

vi.mock('@/components/common/EntityIcon', () => ({
  EntityIcon: () => <div data-testid="entity-icon" />,
}));

vi.mock('@/components/common/AssetIcon', () => ({
  AttributeIcon: () => <div data-testid="attribute-icon" />,
}));

const { useSession: mockUseSession } = await import('@/lib/auth-client');
const { useLoadRotation: mockUseLoadRotation } =
  await import('@/hooks/useLoadRotation');
const { useRotationMutations: mockUseRotationMutations } =
  await import('@/hooks/useRotationMutations');

const mockLoadRotation = vi.fn();
const mockDeleteRotation = vi.fn();
const mockUpdateRotation = vi.fn();

const mockRotation = {
  id: 1,
  ownerId: 'owner-123',
  name: 'Test Rotation',
  description: 'A test rotation',
  totalDamage: 123_456,
  visibility: 'private',
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

describe('SavedRotationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockUseLoadRotation).mockReturnValue(mockLoadRotation);
    vi.mocked(mockUseRotationMutations).mockReturnValue({
      deleteRotation: mockDeleteRotation,
      updateRotation: mockUpdateRotation,
      createRotation: vi.fn(),
      isDeleting: false,
      isUpdating: false,
      isCreating: false,
    } as any);
  });

  it('hides owner controls for other users', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'other-user-123',
        },
      },
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />);

    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /make rotation public/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('loads the saved rotation through the shared loader', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'owner-123',
        },
      },
    } as any);

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />);

    await userEvent.click(screen.getByRole('button', { name: /load/i }));

    expect(mockLoadRotation).toHaveBeenCalledWith(mockRotation);
  });

  it('updates visibility when the owner toggles the public switch', async () => {
    vi.mocked(mockUseSession).mockReturnValue({
      data: {
        user: {
          id: 'owner-123',
        },
      },
    } as any);
    mockUpdateRotation.mockResolvedValue({
      ...mockRotation,
      visibility: 'public',
    });

    const { SavedRotationCard } = await import('./SavedRotationCard');
    render(<SavedRotationCard rotation={mockRotation} />);

    await userEvent.click(
      screen.getByRole('button', { name: /make rotation public/i }),
    );

    await waitFor(() => {
      expect(mockUpdateRotation).toHaveBeenCalledWith({
        id: mockRotation.id,
        visibility: 'public',
      });
    });
  });
});
