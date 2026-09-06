import { getCloudflareContext } from "@opennextjs/cloudflare";

export type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

async function database() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error("The Cloudflare D1 binding named DB is not configured.");
  return env.DB;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const db = await database();
  const result = await db.prepare(sql).bind(...params).all<T>();
  if (!result.success) throw new Error(result.error || "D1 query failed.");
  return { rows: result.results, rowCount: result.results.length };
}

export async function execute(sql: string, params: unknown[] = []) {
  const db = await database();
  const result = await db.prepare(sql).bind(...params).run();
  if (!result.success) throw new Error(result.error || "D1 statement failed.");
  return { rowCount: result.meta.changes };
}

export async function executeBatch(statements: { sql: string; params?: unknown[] }[]) {
  const db = await database();
  const prepared = statements.map(({ sql, params = [] }) => db.prepare(sql).bind(...params));
  const results = await db.batch(prepared);
  if (results.some((result: { success: boolean }) => !result.success)) throw new Error("D1 batch failed.");
  return results;
}

// D1 wraps SQLite errors; it does not expose PostgreSQL constraint fields.
export function isBookingConflict(error: unknown): boolean {
  return error instanceof Error && (error.message.includes("no_overlapping_active_bookings") ||
    (error.cause instanceof Error && isBookingConflict(error.cause)));
}
