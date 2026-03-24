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
      className="bg-background px-panel h-icon-md shrink-0 border-b"
    >
      <Row align="center" gap="inset" className="min-w-0">
        {icon && <div className="text-muted-foreground size-icon-sm">{icon}</div>}
        <Text as="span" variant="heading">
          {title}
        </Text>
        {subtitle && (
          <Text as="span" variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
        {description && <InfoTooltip>{description}</InfoTooltip>}
      </Row>
      {action}
    </Row>
  );
};
