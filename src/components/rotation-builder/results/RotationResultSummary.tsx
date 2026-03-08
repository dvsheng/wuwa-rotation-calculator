import { Row, Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

interface RotationResultSummaryProperties {
  totalDamage: number;
  attackCount: number;
  damageInstanceCount: number;
}

export const RotationResultSummary = ({
  totalDamage,
  attackCount,
  damageInstanceCount,
}: RotationResultSummaryProperties) => {
  return (
    <Row className="border-primary/10 pb-panel justify-between border-b">
      <Stack gap="tight">
        <Text variant="overline">Total Rotation Damage</Text>
        <Text variant="display" className="text-primary leading-none">
          {Math.round(totalDamage).toLocaleString()}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {attackCount} attack{attackCount === 1 ? '' : 's'} · {damageInstanceCount}{' '}
          damage instance{damageInstanceCount === 1 ? '' : 's'}
        </Text>
      </Stack>
    </Row>
  );
};
