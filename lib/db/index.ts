import { count, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import { Pool } from "pg";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });

export { schema };
export * from "./schema";

/** `SELECT count(*)` helper — the drizzle equivalent of Prisma's `model.count()`. */
export async function countRows(
  table: PgTable,
  where?: SQL | undefined
): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
