import type { ReactNode } from 'react';

import { InfoTooltip } from '@/components/common/InfoTooltip';
import { Row } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';

interface DashboardSectionHeaderProperties {
  title: string;
  subtitle?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export const DashboardSectionHeader = ({
  title,
  subtitle,
  description,
  icon,
  action,
}: DashboardSectionHeaderProperties) => {
  return (
    <Row
      justify="between"
      align="center"
      fullWidth
      className="canvas-header border-border px-panel min-w-0 self-start border-b"
    >
      <Row align="center" gap="compact" className="min-w-0">
        {icon ?? <div className="text-muted-foreground size-4">{icon}</div>}
        <Text as="span" variant="heading" className="truncate">
          {title}
        </Text>
        {subtitle ?? (
          <Text as="span" variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
        {description ? <InfoTooltip>{description}</InfoTooltip> : undefined}
      </Row>
      {action}
    </Row>
  );
};
