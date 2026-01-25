import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Attack } from '@/schemas/rotation';

import { RotationAttackSequence } from './RotationAttackSequence';

// Mock react-grid-layout since it relies on DOM measurements
vi.mock('react-grid-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useContainerWidth: () => ({
    width: 500,
    containerRef: { current: null },
    mounted: true,
  }),
}));

describe('RotationAttackSequence', () => {
  const mockAttack: Attack = {
    id: 'test-attack-1',
    name: 'Basic Attack',
    parentName: 'Normal Attack',
    description: 'A basic attack combo',
    characterName: 'Rover',
  };

  const defaultProps = {
    onRemove: vi.fn(),
    onReorder: vi.fn(),
    onDrop: vi.fn(),
  };

  it('shows EmptyRotationState when there are no attacks', () => {
    render(<RotationAttackSequence attacks={[]} {...defaultProps} />);

    expect(
      screen.getByText('Drag skills here to start building your rotation'),
    ).toBeInTheDocument();
  });

  it('hides EmptyRotationState when there are attacks', () => {
    render(<RotationAttackSequence attacks={[mockAttack]} {...defaultProps} />);

    expect(
      screen.queryByText('Drag skills here to start building your rotation'),
    ).not.toBeInTheDocument();
  });

  it('displays correct attack count for single attack', () => {
    render(<RotationAttackSequence attacks={[mockAttack]} {...defaultProps} />);

    expect(screen.getByText('1 Attack')).toBeInTheDocument();
  });

  it('displays correct attack count for multiple attacks', () => {
    const attacks = [
      mockAttack,
      { ...mockAttack, id: 'test-attack-2', name: 'Heavy Attack' },
    ];
    render(<RotationAttackSequence attacks={attacks} {...defaultProps} />);

    expect(screen.getByText('2 Attacks')).toBeInTheDocument();
  });
});
