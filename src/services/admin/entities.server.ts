import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { entities } from '@/db/schema';
import type { Entity, NewEntity } from '@/db/schema';

/**
 * List all entities with optional ordering.
 */
export const listEntitiesHandler = async (): Promise<Array<Entity>> => {
  return database.query.entities.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  });
};

/**
 * Get a single entity by ID.
 */
export const getEntityByIdHandler = async (id: number): Promise<Entity | undefined> => {
  return database.query.entities.findFirst({
    where: eq(entities.id, id),
  });
};

/**
 * Get a single entity with all its capabilities.
 */
export const getEntityWithCapabilitiesHandler = async (id: number) => {
  return database.query.entities.findFirst({
    where: eq(entities.id, id),
    with: {
      attacks: true,
      modifiers: true,
      permanentStats: true,
    },
  });
};

/**
 * Create a new entity.
 */
export const createEntityHandler = async (
  data: Omit<NewEntity, 'createdAt' | 'updatedAt'>,
): Promise<Entity> => {
  const [entity] = await database
    .insert(entities)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return entity;
};

/**
 * Update an existing entity.
 */
export const updateEntityHandler = async (
  id: number,
  data: Partial<Omit<NewEntity, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Entity> => {
  const [entity] = await database
    .update(entities)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(entities.id, id))
    .returning();
  return entity;
};

/**
 * Delete an entity by ID.
 * This will cascade delete all related attacks, modifiers, and permanent stats.
 */
export const deleteEntityHandler = async (id: number): Promise<void> => {
  await database.delete(entities).where(eq(entities.id, id));
};
