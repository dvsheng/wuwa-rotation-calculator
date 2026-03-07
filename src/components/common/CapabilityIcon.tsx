import { Sword } from 'lucide-react';

import { useCapabilityIcon } from '@/hooks/useIcons';
import { cn } from '@/lib/utils';

export type IconSize = 'small' | 'medium' | 'large';

const SIZE_CLASSES: Record<IconSize, string> = {
  small: 'size-icon-sm',
  medium: 'size-icon-md',
  large: 'size-icon-lg',
};

interface CapabilityIconProperties {
  capabilityId?: number;
  iconUrl?: string;
  size?: IconSize;
  className?: string;
}

export const CapabilityIcon = ({
  capabilityId,
  iconUrl,
  size = 'medium',
  className,
}: CapabilityIconProperties) => {
  const { data } = useCapabilityIcon(capabilityId ?? -1, { enabled: !iconUrl });
  const _iconUrl = iconUrl ?? data;

  return (
    <div
      className={cn(
        'bg-capability-icon-bg flex items-center justify-center rounded-md',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {_iconUrl ? (
        <img
          src={_iconUrl}
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
};
