import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

// Cached secret — fetched once per Lambda instance lifetime.
let cachedPassword: string | undefined;

const fetchSecret = async (secretArn: string): Promise<string> => {
  if (cachedPassword) return cachedPassword;
  const sm = new SecretsManagerClient({});
  const { SecretString } = await sm.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  const secret = JSON.parse(SecretString!) as { password: string };
  cachedPassword = secret.password;
  return cachedPassword;
};

function createClient() {
  // Local dev: use a full connection URL from .env
  const url = process.env.DATABASE_URL;
  if (url) return postgres(url);

  const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USERNAME,
    DATABASE_SECRET_ARN,
  } = process.env;

  if (!DATABASE_HOST || !DATABASE_SECRET_ARN) {
    throw new Error(
      'Set DATABASE_URL for local dev, or DATABASE_HOST + DATABASE_SECRET_ARN for Lambda',
    );
  }

  return postgres({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT ?? '5432'),
    database: DATABASE_NAME ?? 'wuwa_rotation_builder',
    username: DATABASE_USERNAME ?? 'postgres',
    ssl: 'require',
    password: () => fetchSecret(DATABASE_SECRET_ARN),
  });
}

/**
 * PostgreSQL database client
 */
const client = createClient();

/**
 * Drizzle database client
 */
export const database = drizzle(client, { schema });

// Pre-warm the connection at module init so the first real request doesn't pay
// the TCP + TLS + Secrets Manager handshake cost.
try {
  await client`SELECT 1`;
} catch {
  // Ignore - if the DB is unreachable at startup we'll surface the error on the first real query.
}
