import { CircleUser } from 'lucide-react';

import { useEntities } from '@/hooks/useEntities';
import { cn } from '@/lib/utils';

import type { IconSize } from './CapabilityIcon';
import { SIZE_CLASSES } from './CapabilityIcon';

export type { IconSize } from './CapabilityIcon';

interface EntityIconDisplayProperties {
  url?: string;
  size?: IconSize;
  className?: string;
}

export const EntityIconDisplay = ({
  url,
  size = 'medium',
  className,
}: EntityIconDisplayProperties) => (
  <div
    className={cn(
      'flex items-center justify-center overflow-hidden rounded-full bg-transparent',
      SIZE_CLASSES[size],
      className,
    )}
  >
    {url ? (
      <img src={url} alt="" className="h-full w-full object-cover" />
    ) : (
      <CircleUser
        className={cn('text-muted-foreground/40 h-full w-full object-cover', className)}
      />
    )}
  </div>
);

interface EntityIconProperties {
  entityId?: number;
  iconUrl?: string;
  size?: IconSize;
  className?: string;
}

export const EntityIcon = ({
  entityId,
  iconUrl,
  size = 'medium',
  className,
}: EntityIconProperties) => {
  const { data: entities } = useEntities({});
  const url = entities.find((entity) => entity.id === entityId)?.iconUrl ?? iconUrl;
  return <EntityIconDisplay url={url} size={size} className={className} />;
};
