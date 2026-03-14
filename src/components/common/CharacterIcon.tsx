import { CircleUser } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { IconSize } from './CapabilityIcon';
import { SIZE_CLASSES } from './CapabilityIcon';

export type { IconSize } from './CapabilityIcon';

interface CharacterIconDisplayProperties {
  url?: string;
  size?: IconSize;
}

export const CharacterIconDisplay = ({
  url,
  size = 'medium',
}: CharacterIconDisplayProperties) => (
  <div
    className={cn(
      'flex items-center justify-center overflow-hidden rounded-full bg-transparent',
      SIZE_CLASSES[size],
    )}
  >
    {url ? (
      <img src={url} alt="" className="h-full w-full object-cover" />
    ) : (
      <CircleUser className={'text-muted-foreground/40 h-full w-full object-cover'} />
    )}
  </div>
);
