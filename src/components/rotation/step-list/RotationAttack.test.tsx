import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Attack } from '@/schemas/rotation';

import { RotationAttack } from './RotationAttack';

describe('RotationAttack', () => {
  const mockAttack: Attack = {
    id: 'test-attack-123',
    name: 'Basic Attack',
    parentName: 'Normal Attack',
    description: 'A basic attack combo',
    characterName: 'Rover',
  };

  it('renders attack name with parent name', () => {
    const onRemove = vi.fn();
    render(<RotationAttack attack={mockAttack} index={0} onRemove={onRemove} />);

    expect(screen.getByText('Normal Attack: Basic Attack')).toBeInTheDocument();
    expect(screen.getByText('Rover')).toBeInTheDocument();
  });

  it('renders attack name without parent name when not provided', () => {
    const attackWithoutParent: Attack = {
      ...mockAttack,
      parentName: undefined,
    };
    const onRemove = vi.fn();
    render(
      <RotationAttack attack={attackWithoutParent} index={0} onRemove={onRemove} />,
    );

    expect(screen.getByText('Basic Attack')).toBeInTheDocument();
  });

  it('displays the correct step number', () => {
    const onRemove = vi.fn();
    render(<RotationAttack attack={mockAttack} index={4} onRemove={onRemove} />);

    expect(screen.getByText('5.')).toBeInTheDocument();
  });

  it('calls onRemove with attack id when trash button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RotationAttack attack={mockAttack} index={0} onRemove={onRemove} />);

    const trashButton = screen.getByRole('button');
    await user.click(trashButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('test-attack-123');
  });
});
