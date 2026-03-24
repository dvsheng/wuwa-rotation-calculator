import { Sword } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Box } from '../ui/layout';

export type IconSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

// TODO: Move this to a constants file instead
export const SIZE_CLASSES = {
  small: 'size-icon-sm',
  medium: 'size-icon-md',
  large: 'size-icon-lg',
  xlarge: 'size-icon-xl',
  xxlarge: 'size-icon-2xl',
} as const;

interface CapabilityIconDisplayProperties {
  url?: string;
  size?: IconSize;
  className?: string;
}

export const CapabilityIconDisplay = ({
  url,
  size = 'medium',
  className,
}: CapabilityIconDisplayProperties) => (
  <Box className={cn('bg-foreground/30 rounded-md', SIZE_CLASSES[size], className)}>
    {url ? (
      <img src={url} className="p-trim" draggable={false} />
    ) : (
      <Sword className={'text-muted-foreground/40 p-trim'} />
    )}
  </Box>
);
