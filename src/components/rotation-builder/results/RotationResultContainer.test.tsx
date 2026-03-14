import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SensitivityAnalysisCategory } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';
import type { ClientRotationResult } from '@/services/rotation-calculator/client-output-adapter/adapt-rotation-result-to-client-output';

import { RotationResultContainer } from './RotationResultContainer';

vi.mock('@/hooks/useRotationCalculation');

const { useRotationCalculation } = await import('@/hooks/useRotationCalculation');
const mockUseRotationCalculation = vi.mocked(useRotationCalculation);

const createResult = (): ClientRotationResult & {
  mergedDamageDetails: Array<never>;
  attackCount: number;
} => ({
  totalDamage: 123_456,
  damageDetails: [],
  mergedDamageDetails: [],
  attackCount: 1,
  sensitivityAnalysis: {
    baselineTotalDamage: 123_456,
    characterIndex: 0,
    scenarios: [
      {
        id: 'substat:crit_rate',
        category: SensitivityAnalysisCategory.SUBSTAT_ROLL,
        label: '+1 Crit Rate roll',
        description: 'Adds one extra 7.5 Crit Rate substat roll to character 1.',
        perturbedTotalDamage: 126_000,
        totalDamageDelta: 2544,
        relativeDelta: 0.0206,
      },
    ],
  },
});

describe('RotationResultContainer', () => {
  beforeEach(() => {
    mockUseRotationCalculation.mockReturnValue({
      data: createResult(),
      isStale: false,
    } as unknown as ReturnType<typeof useRotationCalculation>);
  });

  it('renders the sensitivity tab and updates details when a row is selected', async () => {
    render(<RotationResultContainer />);

    await userEvent.click(screen.getByRole('tab', { name: 'Sensitivity' }));

    expect(screen.getByText('Substat Rolls')).toBeInTheDocument();
    expect(screen.getByText('+1 Crit Rate roll')).toBeInTheDocument();
    expect(screen.getByText('No Scenario Selected')).toBeInTheDocument();

    await userEvent.click(screen.getByText('+1 Crit Rate roll'));

    expect(screen.getByText('Sensitivity Scenario')).toBeInTheDocument();
    expect(
      screen.getAllByText('Adds one extra 7.5 Crit Rate substat roll to character 1.'),
    ).toHaveLength(2);
    expect(screen.getByText('126,000')).toBeInTheDocument();
  });
});
