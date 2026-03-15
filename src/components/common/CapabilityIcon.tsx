import { Sword } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Box } from '../ui/layout';

export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';

// TODO: Move this to a constants file instead
export const SIZE_CLASSES = {
  small: 'size-icon-sm',
  medium: 'size-icon-md',
  large: 'size-icon-lg',
  xlarge: 'size-icon-xl',
} as const;

interface CapabilityIconDisplayProperties {
  url?: string;
  className?: string;
}

export const CapabilityIconDisplay = ({
  url,
  className,
}: CapabilityIconDisplayProperties) => (
  <Box className={cn('bg-secondary/30 size-icon-md rounded-md', className)}>
    {url ? (
      <img src={url} className="p-trim" draggable={false} />
    ) : (
      <Sword className={'text-muted-foreground/40 p-trim'} />
    )}
  </Box>
);
