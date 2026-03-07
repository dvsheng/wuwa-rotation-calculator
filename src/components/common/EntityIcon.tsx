import { CircleUser } from 'lucide-react';

import { useEntityIcon } from '@/hooks/useIcons';
import { cn } from '@/lib/utils';

import type { IconSize } from './CapabilityIcon';
import { SIZE_CLASSES } from './CapabilityIcon';

export type { IconSize } from './CapabilityIcon';

interface EntityIconDisplayProperties {
  url?: string;
  size?: IconSize;
}

export const EntityIconDisplay = ({
  url,
  size = 'medium',
}: EntityIconDisplayProperties) => (
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

interface EntityIconProperties {
  entityId?: number;
  iconUrl?: string;
  size?: IconSize;
}

export const EntityIcon = ({
  entityId,
  iconUrl,
  size = 'medium',
}: EntityIconProperties) => {
  const { data } = useEntityIcon(entityId ?? -1, { enabled: !iconUrl });
  return <EntityIconDisplay url={iconUrl ?? data} size={size} />;
};
