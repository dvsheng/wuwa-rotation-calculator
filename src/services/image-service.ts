export type EntityType = 'character' | 'weapon' | 'echo' | 'attribute';
export type ImageType = 'icon' | 'background' | 'phantom';
export type UiIconName = 'role' | 'weapon' | 'gourd';

/**
 * Resolves a local path for a game asset.
 * Assets are stored in src/assets/{entity}/{type}/{id}.webp
 */
export const resolveImagePath = (
  entity: EntityType,
  type: ImageType,
  id: string | number,
): string => {
  // Use import.meta.url to provide the "base" for the relative path
  return new URL(`../assets/${entity}/${type}/${id}.webp`, import.meta.url).href;
};

/**
 * Resolves a local path for a functional UI asset.
 * Assets are stored in src/assets/ui/{name}.webp
 */
export const resolveUiPath = (name: UiIconName): string => {
  return new URL(`../assets/ui/${name}.webp`, import.meta.url).href;
};
