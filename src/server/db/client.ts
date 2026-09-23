import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
/** Either the root handle or a transaction handle; services accept both. */
export type Executor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

type GlobalWithDb = typeof globalThis & { __neuroPool?: Pool; __neuroDb?: Database };
const g = globalThis as GlobalWithDb;

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: process.env.SERVICE_NAME ?? 'neuro-ai-web',
  });
  return pool;
}

/**
 * Lazily-created singleton. Cached on globalThis so Next.js dev-mode hot reloads
 * do not leak a new connection pool on every file change.
 */
export function getPool(): Pool {
  g.__neuroPool ??= createPool();
  return g.__neuroPool;
}

export function getDb(): Database {
  g.__neuroDb ??= drizzle(getPool(), { schema, casing: 'snake_case' });
  return g.__neuroDb;
}

export async function closeDb(): Promise<void> {
  await g.__neuroPool?.end();
  g.__neuroPool = undefined;
  g.__neuroDb = undefined;
}

export { schema };
