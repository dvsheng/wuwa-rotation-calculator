import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import { downloadRotationResultCsv } from './rotation-result-export.utilities';
import { RotationResultSummary } from './RotationResultSummary';

vi.mock('./rotation-result-export.utilities', () => ({
  downloadRotationResultCsv: vi.fn(),
}));

const mockDownloadRotationResultCsv = vi.mocked(downloadRotationResultCsv);

describe('RotationResultSummary', () => {
  it('exports the merged damage details when the CSV button is clicked', async () => {
    const user = userEvent.setup();
    const mergedDamageDetails = [{}] as Array<RotationResultMergedDamageDetail>;

    render(
      <RotationResultSummary
        totalDamage={123_456}
        attackCount={3}
        damageInstanceCount={4}
        mergedDamageDetails={mergedDamageDetails}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(mockDownloadRotationResultCsv).toHaveBeenCalledWith(mergedDamageDetails);
  });

  it('disables CSV export when there are no damage instances to export', () => {
    render(
      <RotationResultSummary
        totalDamage={0}
        attackCount={0}
        damageInstanceCount={0}
        mergedDamageDetails={[]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });
});
