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
  characterEntityId?: number;
  iconUrl?: string;
  size?: IconSize;
}

export const CharacterIcon = ({
  characterEntityId,
  iconUrl,
  size = 'medium',
}: CharacterIconProperties) => {
  const { data } = useEntityIcon(characterEntityId ?? -1, { enabled: !iconUrl });
  const _iconUrl = iconUrl ?? data;

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-transparent',
        SIZE_CLASSES[size],
      )}
    >
      {_iconUrl ? (
        <img src={_iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <CircleUser className={'text-muted-foreground/40 h-full w-full object-cover'} />
      )}
    </div>
  );
};
