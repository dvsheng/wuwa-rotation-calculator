import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { CreateEntitySchema, UpdateEntitySchema } from '@/schemas/admin/entities';

import {
  createEntityHandler,
  deleteEntityHandler,
  getEntityByIdHandler,
  getEntityWithCapabilitiesHandler,
  listEntitiesHandler,
  updateEntityHandler,
} from './entities.server';

/**
 * List all entities.
 */
export const listEntities = createServerFn({ method: 'GET' }).handler(async () => {
  return listEntitiesHandler();
});

/**
 * Get a single entity by ID.
 */
export const getEntityById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return getEntityByIdHandler(data.id);
  });

/**
 * Get a single entity with all its capabilities.
 */
export const getEntityWithCapabilities = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return getEntityWithCapabilitiesHandler(data.id);
  });

/**
 * Create a new entity.
 */
export const createEntity = createServerFn({ method: 'POST' })
  .inputValidator(CreateEntitySchema)
  .handler(async ({ data }) => {
    return createEntityHandler(data);
  });

/**
 * Update an existing entity.
 */
export const updateEntity = createServerFn({ method: 'POST' })
  .inputValidator(UpdateEntitySchema)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    return updateEntityHandler(id, updates);
  });

/**
 * Delete an entity by ID.
 */
export const deleteEntity = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return deleteEntityHandler(data.id);
  });
