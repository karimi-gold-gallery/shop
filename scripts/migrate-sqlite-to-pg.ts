/**
 * One-off: copy all rows from ./db.sqlite into DATABASE_URL (Postgres).
 * Replaces existing Postgres data for these tables.
 */
import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { Client } from "pg";

const SQLITE_PATH = "./db.sqlite";

const TABLES = [
  "User",
  "Category",
  "Setting",
  "Session",
  "Product",
  "ProductImage",
  "CartItem",
  "Order",
  "OrderItem",
] as const;

const BOOL_COLS: Record<string, string[]> = {
  User: ["onboarded"],
  Product: ["active"],
};

const DATE_COLS: Record<string, string[]> = {
  User: ["createdAt", "updatedAt"],
  Session: ["expiresAt", "createdAt"],
  Category: ["createdAt", "updatedAt"],
  Product: ["createdAt", "updatedAt"],
  ProductImage: ["createdAt"],
  CartItem: ["createdAt"],
  Order: ["createdAt", "updatedAt"],
  OrderItem: ["createdAt"],
};

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function normalizeRow(
  table: (typeof TABLES)[number],
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };

  for (const col of BOOL_COLS[table] ?? []) {
    if (out[col] !== null && out[col] !== undefined) {
      out[col] = Boolean(out[col]);
    }
  }

  for (const col of DATE_COLS[table] ?? []) {
    if (typeof out[col] === "string" || typeof out[col] === "number") {
      out[col] = new Date(out[col] as string | number);
    }
  }

  if (table === "ProductImage" && out.data != null) {
    out.data =
      out.data instanceof Uint8Array
        ? Buffer.from(out.data)
        : Buffer.from(out.data as Buffer);
  }

  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sqlite = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();

  try {
    await pg.query("BEGIN");
    await pg.query(
      `TRUNCATE TABLE ${TABLES.map(quoteIdent).join(", ")} RESTART IDENTITY CASCADE`,
    );

    for (const table of TABLES) {
      const rows = sqlite
        .prepare(`SELECT * FROM ${quoteIdent(table)}`)
        .all() as Record<string, unknown>[];

      if (rows.length === 0) {
        console.log(`${table}: 0 rows`);
        continue;
      }

      const cols = Object.keys(rows[0]!);
      const colList = cols.map(quoteIdent).join(", ");
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `INSERT INTO ${quoteIdent(table)} (${colList}) VALUES (${placeholders})`;

      for (const raw of rows) {
        const row = normalizeRow(table, raw);
        await pg.query(
          sql,
          cols.map((c) => row[c]),
        );
      }

      console.log(`${table}: ${rows.length} rows`);
    }

    await pg.query("COMMIT");
    console.log("Migration complete.");
  } catch (err) {
    await pg.query("ROLLBACK");
    throw err;
  } finally {
    await pg.end();
    sqlite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
