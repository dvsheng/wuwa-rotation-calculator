import { cn } from '@/lib/utils';
import type { EntityType, ImageType } from '@/services/image-service';
import { resolveImagePath } from '@/services/image-service';

interface GameImageProperties extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'id'
> {
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
  ...properties
}: GameImageProperties) => {
  const source = resolveImagePath(entity, type, id);

  return <img src={source} alt={alt} className={cn(className)} {...properties} />;
};
