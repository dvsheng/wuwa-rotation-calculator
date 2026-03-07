import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

function createClient() {
  // Local dev: use a full connection URL from .env
  const url = process.env.DATABASE_URL;
  if (url) return postgres(url);

  // Lambda: non-secret parts are plain env vars; password is resolved lazily
  // from Secrets Manager on first connection (postgres.js calls the async fn
  // only when it opens the first physical connection).
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
    password: async () => {
      const { SecretsManagerClient, GetSecretValueCommand } =
        await import('@aws-sdk/client-secrets-manager');
      const sm = new SecretsManagerClient({});
      const { SecretString } = await sm.send(
        new GetSecretValueCommand({ SecretId: DATABASE_SECRET_ARN }),
      );
      const secret = JSON.parse(SecretString!) as { password: string };
      return secret.password;
    },
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
