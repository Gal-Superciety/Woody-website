import pg from 'pg';

const { Pool } = pg;

export function getForestPool() {
  const connectionString = process.env.FOREST_DATABASE_URL;
  if (!connectionString) throw new Error('FOREST_DATABASE_URL is not configured.');

  if (!globalThis.__woodyForestPool) {
    globalThis.__woodyForestPool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 8_000,
      query_timeout: 10_000,
    });
  }

  return globalThis.__woodyForestPool;
}
