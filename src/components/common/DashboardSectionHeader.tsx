import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { Row } from '@/components/ui/layout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
          <Text as="span" variant="caption">
            {subtitle}
          </Text>
        )}
        {description ? (
          <Tooltip>
            <TooltipContent side="right">{description}</TooltipContent>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground size-4" />
            </TooltipTrigger>
          </Tooltip>
        ) : undefined}
      </Row>
      {action}
    </Row>
  );
};
