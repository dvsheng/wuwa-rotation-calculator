import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { attacks } from '@/db/schema';
import type { Attack, NewAttack } from '@/db/schema';

/**
 * List all attacks with optional ordering.
 */
export const listAttacksHandler = async (): Promise<Array<Attack>> => {
  return database.query.attacks.findMany({
    orderBy: (table, { asc }) => [asc(table.entityId), asc(table.name)],
  });
};

/**
 * Get a single attack by ID.
 */
export const getAttackByIdHandler = async (id: number): Promise<Attack | undefined> => {
  return database.query.attacks.findFirst({
    where: eq(attacks.id, id),
  });
};

/**
 * Create a new attack.
 */
export const createAttackHandler = async (
  data: Omit<NewAttack, 'createdAt' | 'updatedAt'>,
): Promise<Attack> => {
  const [attack] = await database
    .insert(attacks)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return attack;
};

/**
 * Update an existing attack.
 */
export const updateAttackHandler = async (
  id: number,
  data: Partial<Omit<NewAttack, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Attack> => {
  const [attack] = await database
    .update(attacks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(attacks.id, id))
    .returning();
  return attack;
};

/**
 * Delete an attack by ID.
 */
export const deleteAttackHandler = async (id: number): Promise<void> => {
  await database.delete(attacks).where(eq(attacks.id, id));
};
