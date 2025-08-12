import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

function buildDatabaseUrlFromEnv(): string | undefined {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? '5432';
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!host || !dbName || !user || !password) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
}

const rawDatabaseUrl = process.env.DATABASE_URL || buildDatabaseUrlFromEnv();

function determineSslMode(url: string | undefined): 'disable' | 'require' | 'no-verify' | undefined {
  if (!url) return undefined;
  const envSslMode = (process.env.PGSSLMODE || process.env.DB_SSL_MODE || '').toLowerCase();
  if (envSslMode === 'disable') return 'disable';
  if (envSslMode === 'require') return 'require';
  if (envSslMode === 'no-verify' || envSslMode === 'allow' || envSslMode === 'prefer-no-verify') return 'no-verify';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    // Default for non-local DBs: avoid cert verification issues in CLI tools
    return isLocal ? undefined : 'no-verify';
  } catch {
    return undefined;
  }
}

function withSslMode(url: string | undefined, sslMode: ReturnType<typeof determineSslMode>): string | undefined {
  if (!url || !sslMode || url.includes('sslmode=')) return url;
  return url.includes('?') ? `${url}&sslmode=${sslMode}` : `${url}?sslmode=${sslMode}`;
}

const sslMode = determineSslMode(rawDatabaseUrl);
const databaseUrl = withSslMode(rawDatabaseUrl, sslMode);

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dbCredentials: databaseUrl
    ? {
        url: databaseUrl,
        ssl:
          sslMode === 'no-verify'
            ? { rejectUnauthorized: false }
            : sslMode === 'require'
              ? true
              : undefined,
      }
    : // Allow running CLI commands that don't need a DB without failing when envs are missing
      // You should set DATABASE_URL or DB_* env vars before using Drizzle CLI that hits the DB.
      ({} as any),
  verbose: true,
});


