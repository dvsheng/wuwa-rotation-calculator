import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { CreateModifierSchema, UpdateModifierSchema } from '@/schemas/admin/modifiers';

import {
  createModifierHandler,
  deleteModifierHandler,
  getModifierByIdHandler,
  listModifiersHandler,
  updateModifierHandler,
} from './modifiers.server';

/**
 * List all modifiers.
 */
export const listModifiers = createServerFn({ method: 'GET' }).handler(async () => {
  return listModifiersHandler();
});

/**
 * Get a single modifier by ID.
 */
export const getModifierById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return getModifierByIdHandler(data.id);
  });

/**
 * Create a new modifier.
 */
export const createModifier = createServerFn({ method: 'POST' })
  .inputValidator(CreateModifierSchema)
  .handler(async ({ data }) => {
    return createModifierHandler(data);
  });

/**
 * Update an existing modifier.
 */
export const updateModifier = createServerFn({ method: 'POST' })
  .inputValidator(UpdateModifierSchema)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    return updateModifierHandler(id, updates);
  });

/**
 * Delete a modifier by ID.
 */
export const deleteModifier = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return deleteModifierHandler(data.id);
  });
