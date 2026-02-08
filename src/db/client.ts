import path from 'node:path';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schema';

const DB_PATH = path.join(process.cwd(), '.local', 'data', 'game-data.db');

/**
 * SQLite database instance
 */
const client = createClient({
  url: `file:${DB_PATH}`,
});

/**
 * Drizzle database client
 */
export const database = drizzle(client, { schema });
