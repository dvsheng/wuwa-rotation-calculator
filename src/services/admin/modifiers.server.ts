import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { modifiers } from '@/db/schema';
import type { Modifier, NewModifier } from '@/db/schema';

/**
 * List all modifiers with optional ordering.
 */
export const listModifiersHandler = async (): Promise<Array<Modifier>> => {
  return database.query.modifiers.findMany({
    orderBy: (table, { asc }) => [asc(table.entityId), asc(table.name)],
  });
};

/**
 * Get a single modifier by ID.
 */
export const getModifierByIdHandler = async (
  id: number,
): Promise<Modifier | undefined> => {
  return database.query.modifiers.findFirst({
    where: eq(modifiers.id, id),
  });
};

/**
 * Create a new modifier.
 */
export const createModifierHandler = async (
  data: Omit<NewModifier, 'createdAt' | 'updatedAt'>,
): Promise<Modifier> => {
  const [modifier] = await database
    .insert(modifiers)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return modifier;
};

/**
 * Update an existing modifier.
 */
export const updateModifierHandler = async (
  id: number,
  data: Partial<Omit<NewModifier, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Modifier> => {
  const [modifier] = await database
    .update(modifiers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(modifiers.id, id))
    .returning();
  return modifier;
};

/**
 * Delete a modifier by ID.
 */
export const deleteModifierHandler = async (id: number): Promise<void> => {
  await database.delete(modifiers).where(eq(modifiers.id, id));
};
