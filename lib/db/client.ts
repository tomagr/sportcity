import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function buildDatabaseUrlFromEnv(): string | undefined {
  const direct = process.env.DATABASE_URL;
  if (direct) return direct;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5432';
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!host || !dbName || !user || !password) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
}

const databaseUrl = buildDatabaseUrlFromEnv();

if (!databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn('LOG =====> DATABASE_URL/DB_* env vars are missing. Drizzle client not fully initialized.');
}

function shouldUseSsl(url: string | undefined): boolean {
  if (!url) return false;
  if (process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require') return true;
  if (url.includes('sslmode=require')) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    return !isLocal;
  } catch {
    return false;
  }
}

const useSSL = shouldUseSsl(databaseUrl);

if (useSSL) {
  // eslint-disable-next-line no-console
  console.log('LOG =====> Using SSL for Postgres connection');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });


