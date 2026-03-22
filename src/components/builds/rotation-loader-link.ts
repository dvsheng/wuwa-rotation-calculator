import type { BuildLocationFn } from '@tanstack/react-router';

export const getRotationLoaderRouteOptions = (rotationId: number) => ({
  to: '/create' as const,
  search: {
    rotationId,
    tab: 'results' as const,
  },
});

export const buildRotationLoaderUrl = (
  rotationId: number,
  buildLocation: BuildLocationFn,
  origin = globalThis.location.origin,
) => {
  const href = buildLocation(getRotationLoaderRouteOptions(rotationId)).href;

  return origin ? new URL(href, origin).toString() : href;
};
