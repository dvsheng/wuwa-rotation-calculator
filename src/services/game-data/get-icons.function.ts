import { createServerFn } from '@tanstack/react-start';

import type { GetIconsRequest } from '@/schemas/game-data-service';

import { getIconsHandler } from './get-icons.server';

/**
 * Server function to get icon URLs for attacks, modifiers, permanentStats, and entities.
 * Returns a map of ID to icon URL.
 */
export const getIcons = createServerFn({ method: 'GET' })
  .inputValidator((data: GetIconsRequest) => data)
  .handler(async ({ data }) => {
    return getIconsHandler(data);
  });
