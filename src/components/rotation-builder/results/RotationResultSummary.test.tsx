import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RotationResultSummary } from './RotationResultSummary';

describe('RotationResultSummary', () => {
  it('rounds and displays the total rotation damage', () => {
    render(
      <RotationResultSummary
        totalDamage={123_456.78}
        attackCount={3}
        damageInstanceCount={4}
      />,
    );

    expect(screen.getByText('123,457')).toBeInTheDocument();
  });

  it('renders the attack and damage-instance counts', () => {
    render(
      <RotationResultSummary totalDamage={0} attackCount={1} damageInstanceCount={2} />,
    );

    expect(screen.getByText('1 attack · 2 damage instances')).toBeInTheDocument();
  });
});
