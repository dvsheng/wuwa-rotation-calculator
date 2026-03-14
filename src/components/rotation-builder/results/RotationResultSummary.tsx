import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import type { RotationResultMergedDamageDetail } from '@/hooks/useRotationCalculation';

import { downloadRotationResultCsv } from './rotation-result-export.utilities';

interface RotationResultSummaryProperties {
  totalDamage: number;
  attackCount: number;
  damageInstanceCount: number;
  mergedDamageDetails: Array<RotationResultMergedDamageDetail>;
}

export const RotationResultSummary = ({
  totalDamage,
  attackCount,
  damageInstanceCount,
  mergedDamageDetails,
}: RotationResultSummaryProperties) => {
  return (
    <Row justify="between" className="border-primary/10 pb-panel border-b">
      <Stack gap="tight">
        <Text variant="overline" tone="muted">
          Total Rotation Damage
        </Text>
        <Text variant="display" className="text-primary leading-none">
          {Math.round(totalDamage).toLocaleString()}
        </Text>
        <Text variant="caption" tone="muted">
          {attackCount} attack{attackCount === 1 ? '' : 's'} · {damageInstanceCount}{' '}
          damage instance{damageInstanceCount === 1 ? '' : 's'}
        </Text>
      </Stack>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadRotationResultCsv(mergedDamageDetails)}
        disabled={mergedDamageDetails.length === 0}
      >
        <Download />
        Export CSV
      </Button>
    </Row>
  );
};
