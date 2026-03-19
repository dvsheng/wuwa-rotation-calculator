import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RotationTable } from './RotationTable';

vi.mock('@/hooks/useLoadRotation', () => ({
  useLoadRotation: vi.fn(() => vi.fn()),
}));

vi.mock('@/components/common/EntityIcon', () => ({
  EntityIcon: () => <div data-testid="entity-icon" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('RotationTable', () => {
  const rotations = [
    {
      id: 1,
      ownerId: 'owner-123',
      isOwner: true,
      name: 'My Public Rotation',
      description: undefined,
      totalDamage: 1234,
      visibility: 'public',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      data: {
        team: [{ id: 101 }, { id: 0 }, { id: 0 }],
        enemy: {},
        attacks: [],
        buffs: [],
      },
    },
    {
      id: 2,
      ownerId: 'other-user',
      isOwner: false,
      name: 'Community Rotation',
      description: 'Shared',
      totalDamage: 5678,
      visibility: 'public',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
      data: {
        team: [{ id: 102 }, { id: 0 }, { id: 0 }],
        enemy: {},
        attacks: [],
        buffs: [],
      },
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rows without owner actions when showOwnerActions is false', () => {
    render(
      <RotationTable
        title="Public Rotations"
        description="Shared rotations"
        rotations={rotations}
        showOwnerActions={false}
        emptyMessage="No public rotations found."
      />,
      { wrapper },
    );

    expect(screen.queryByLabelText(/make rotation public/i)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/view details for/i)).toHaveLength(2);
    expect(screen.getAllByTestId('entity-icon')).toHaveLength(2);
    expect(screen.getByText('5,678')).toBeInTheDocument();
    expect(screen.getByText('Community Rotation')).toBeInTheDocument();
  });
});
