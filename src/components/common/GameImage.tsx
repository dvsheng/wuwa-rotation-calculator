import { cn } from '@/lib/utils';
import type { EntityType, ImageType } from '@/services/image-service';
import { resolveImagePath } from '@/services/image-service';

interface GameImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'id'> {
  entity: EntityType;
  type: ImageType;
  id: string | number;
}

/**
 * A standard image component for game assets stored locally.
 */
export const GameImage = ({
  entity,
  type,
  id,
  className,
  alt,
  ...props
}: GameImageProps) => {
  const src = resolveImagePath(entity, type, id);

  return <img src={src} alt={alt} className={cn(className)} {...props} />;
};
