import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import {
  CreatePermanentStatSchema,
  UpdatePermanentStatSchema,
} from '@/schemas/admin/permanent-stats';

import {
  createPermanentStatHandler,
  deletePermanentStatHandler,
  getPermanentStatByIdHandler,
  listPermanentStatsHandler,
  updatePermanentStatHandler,
} from './permanent-stats.server';

/**
 * List all permanent stats.
 */
export const listPermanentStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    return listPermanentStatsHandler();
  },
);

/**
 * Get a single permanent stat by ID.
 */
export const getPermanentStatById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return getPermanentStatByIdHandler(data.id);
  });

/**
 * Create a new permanent stat.
 */
export const createPermanentStat = createServerFn({ method: 'POST' })
  .inputValidator(CreatePermanentStatSchema)
  .handler(async ({ data }) => {
    return createPermanentStatHandler(data);
  });

/**
 * Update an existing permanent stat.
 */
export const updatePermanentStat = createServerFn({ method: 'POST' })
  .inputValidator(UpdatePermanentStatSchema)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    return updatePermanentStatHandler(id, updates);
  });

/**
 * Delete a permanent stat by ID.
 */
export const deletePermanentStat = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return deletePermanentStatHandler(data.id);
  });
