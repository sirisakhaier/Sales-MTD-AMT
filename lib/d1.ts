import { getCloudflareContext } from '@opennextjs/cloudflare';

export type D1Database = any;

/**
 * Returns the Cloudflare D1 database binding.
 * Must be called within a request handler.
 */
export async function getDB(): Promise<D1Database> {
  const ctx = getCloudflareContext();
  return (ctx.env as any).DB;
}

/**
 * Helper to get a single row from D1.
 * Equivalent to better-sqlite3's .get()
 */
export async function dbGet<T = any>(
  db: D1Database,
  sql: string,
  ...params: any[]
): Promise<T | null> {
  const stmt = db.prepare(sql);
  const result = params.length > 0
    ? await stmt.bind(...params).first()
    : await stmt.first();
  return (result as T) || null;
}

/**
 * Helper to get all rows from D1.
 * Equivalent to better-sqlite3's .all()
 */
export async function dbAll<T = any>(
  db: D1Database,
  sql: string,
  ...params: any[]
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const result = params.length > 0
    ? await stmt.bind(...params).all()
    : await stmt.all();
  return ((result && result.results) as T[]) || [];
}

/**
 * Helper to run a statement in D1.
 * Equivalent to better-sqlite3's .run()
 */
export async function dbRun(
  db: D1Database,
  sql: string,
  ...params: any[]
): Promise<void> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    await stmt.bind(...params).run();
  } else {
    await stmt.run();
  }
}
