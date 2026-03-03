import { CircleUser } from 'lucide-react';

import { useEntityIcon } from '@/hooks/useIcons';
import { cn } from '@/lib/utils';

export type IconSize = 'small' | 'medium' | 'large';

const SIZE_CLASSES: Record<IconSize, string> = {
  small: 'size-icon-sm',
  medium: 'size-icon-md',
  large: 'size-icon-lg',
};

interface CharacterIconProperties {
  characterEntityId: number;
  size?: IconSize;
}

export const CharacterIcon = ({
  characterEntityId,
  size = 'medium',
}: CharacterIconProperties) => {
  const { data: iconUrl } = useEntityIcon(characterEntityId);

  return (
    <div
      className={cn(
        'bg-muted flex items-center justify-center overflow-hidden rounded-full',
        SIZE_CLASSES[size],
      )}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <CircleUser className={'text-muted-foreground/40 h-full w-full object-cover'} />
      )}
    </div>
  );
};
