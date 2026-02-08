import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { CreateAttackSchema, UpdateAttackSchema } from '@/schemas/admin/attacks';

import {
  createAttackHandler,
  deleteAttackHandler,
  getAttackByIdHandler,
  listAttacksHandler,
  updateAttackHandler,
} from './attacks.server';

/**
 * List all attacks.
 */
export const listAttacks = createServerFn({ method: 'GET' }).handler(async () => {
  return listAttacksHandler();
});

/**
 * Get a single attack by ID.
 */
export const getAttackById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return getAttackByIdHandler(data.id);
  });

/**
 * Create a new attack.
 */
export const createAttack = createServerFn({ method: 'POST' })
  .inputValidator(CreateAttackSchema)
  .handler(async ({ data }) => {
    return createAttackHandler(data);
  });

/**
 * Update an existing attack.
 */
export const updateAttack = createServerFn({ method: 'POST' })
  .inputValidator(UpdateAttackSchema)
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    return updateAttackHandler(id, updates);
  });

/**
 * Delete an attack by ID.
 */
export const deleteAttack = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    return deleteAttackHandler(data.id);
  });
