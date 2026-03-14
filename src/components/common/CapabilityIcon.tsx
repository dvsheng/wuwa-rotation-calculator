import { Sword } from 'lucide-react';

import { cn } from '@/lib/utils';

export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';

export const SIZE_CLASSES = {
  small: 'size-icon-sm',
  medium: 'size-icon-md',
  large: 'size-icon-lg',
  xlarge: 'size-icon-xl',
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
  <div
    className={cn(
      'bg-capability-icon-bg flex items-center justify-center rounded-md',
      SIZE_CLASSES[size],
      className,
    )}
  >
    {url ? (
      <img
        src={url}
        alt=""
        className="p-tight h-full w-full object-contain"
        draggable={false}
      />
    ) : (
      <Sword
        className={'text-muted-foreground/40 p-tight h-full w-full object-contain'}
      />
    )}
  </div>
);
