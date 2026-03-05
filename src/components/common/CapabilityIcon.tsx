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
  capabilityId: number;
  size?: IconSize;
  className?: string;
}

export const CapabilityIcon = ({
  capabilityId,
  size = 'medium',
  className,
}: CapabilityIconProperties) => {
  const { data: iconUrl } = useCapabilityIcon(capabilityId);

  return (
    <div
      className={cn(
        'bg-capability-icon-bg flex items-center justify-center rounded-md',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
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
