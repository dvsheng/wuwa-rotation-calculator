import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  throw new Error('DATABASE_URL environment variable not set');
}

/**
 * PostgreSQL database client
 */
const client = postgres(process.env.DATABASE_URL);

/**
 * Drizzle database client
 */
export const database = drizzle(client, { schema });
