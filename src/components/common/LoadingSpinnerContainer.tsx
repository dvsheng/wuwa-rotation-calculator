import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Stack } from '@/components/ui/layout';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface LoadingSpinnerContainerProperties {
  message?: ReactNode;
  className?: string;
  spinnerClassName?: string;
  spinnerSize?: number;
}

export const LoadingSpinnerContainer = ({
  message = 'Loading...',
  className,
  spinnerClassName,
  spinnerSize = 16,
}: LoadingSpinnerContainerProperties) => (
  <Stack
    align="center"
    justify="center"
    gap="inset"
    className={cn('h-full min-h-0 w-full', className)}
  >
    <Loader2
      size={spinnerSize}
      className={cn('text-muted-foreground animate-spin', spinnerClassName)}
    />
    {typeof message === 'string' ? (
      <Text variant="bodySm" tone="muted">
        {message}
      </Text>
    ) : (
      message
    )}
  </Stack>
);
