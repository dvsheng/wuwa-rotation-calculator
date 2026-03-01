import { useIcons } from '@/hooks/useIcons';
import { cn } from '@/lib/utils';
import { EntityType } from '@/services/game-data';
import type { ImageType } from '@/services/image-service';
import { resolveImagePath } from '@/services/image-service';

interface GameImageProperties extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'id'
> {
  entity: EntityType | 'attribute';
  type: ImageType;
  id: string | number;
}

/**
 * A standard image component for game assets.
 * For entity icons, uses the icon service to fetch from a game data API.
 * For other image types, uses local assets.
 */
export const GameImage = ({
  entity,
  type,
  id,
  className,
  alt,
  ...properties
}: GameImageProperties) => {
  // Use icon service for entity icons (character, weapon, echo)
  const shouldUseIconService =
    type === 'icon' && Object.values(EntityType).includes(entity as EntityType);

  const { data: iconData } = useIcons(
    shouldUseIconService ? [{ id: Number(id), type: 'entity' }] : [],
  );

  const source =
    shouldUseIconService && iconData?.[0]?.iconUrl
      ? iconData[0].iconUrl
      : resolveImagePath(entity, type, id);

  return <img src={source} alt={alt} className={cn(className)} {...properties} />;
};
