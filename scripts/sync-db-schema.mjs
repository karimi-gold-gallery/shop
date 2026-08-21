/**
 * Applies idempotent SQL so the live PostgreSQL database matches lib/db/schema.ts.
 * Safe to run multiple times. Use on Liara shell or anywhere DATABASE_URL resolves.
 *
 *   node scripts/sync-db-schema.mjs
 *   npm run db:sync
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const drizzleDir = path.join(__dirname, "..", "drizzle");

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const migrationFiles = [
  "0000_karat_gold_prices.sql",
  "0002_product_variants_fix.sql",
];

function splitStatements(sql) {
  return sql
    .split(/--> statement-breakpoint/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

async function verifySchema(pool) {
  const checks = [];

  const color = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'Product' AND column_name = 'color'`
  );
  checks.push(["Product.color column", color.rowCount === 1]);

  const slugIdx = await pool.query(
    `SELECT indexname, indexdef FROM pg_indexes
     WHERE tablename = 'Product' AND indexname IN ('Product_slug_key', 'Product_slug_idx')`
  );
  const names = slugIdx.rows.map((r) => r.indexname);
  checks.push(["Product_slug_idx exists", names.includes("Product_slug_idx")]);
  checks.push(["Product_slug_key removed", !names.includes("Product_slug_key")]);

  const goldPrice = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'GoldPrice'`
  );
  checks.push(["GoldPrice table", goldPrice.rowCount === 1]);

  const productKarat = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'Product' AND column_name = 'karat'`
  );
  checks.push(["Product.karat column", productKarat.rowCount === 1]);

  return checks;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const masked = url.replace(/:([^:@/]+)@/, ":****@");
  console.log(`Connecting to ${masked}`);

  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 15_000,
  });

  try {
    await pool.query("select 1");
    console.log("Connected.\n");

    for (const file of migrationFiles) {
      const filePath = path.join(drizzleDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing migration file: ${file}`);
      }

      const sql = fs.readFileSync(filePath, "utf8");
      const statements = splitStatements(sql);

      console.log(`Applying ${file} (${statements.length} statement(s))...`);
      for (const statement of statements) {
        await pool.query(statement);
      }
    }

    console.log("\nSchema verification:");
    const checks = await verifySchema(pool);
    let ok = true;
    for (const [label, passed] of checks) {
      console.log(`  ${passed ? "✓" : "✗"} ${label}`);
      if (!passed) ok = false;
    }

    if (!ok) {
      console.error("\nSome checks failed. Review the database manually.");
      process.exit(1);
    }

    console.log("\nDatabase schema is in sync with the codebase.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("\nSchema sync failed:", message);

    if (error instanceof Error && "code" in error) {
      const code = error.code;
      if (code === "ENOTFOUND") {
        console.error(
          "\nHint: DATABASE_URL host does not resolve from this machine.",
          "On Liara use the internal hostname (karimigoldgallery-db).",
          "For local dev use the public connection string from the Liara panel."
        );
      } else if (code === "ETIMEDOUT" || code === "ECONNREFUSED") {
        console.error(
          "\nHint: Database is unreachable. Check that Postgres is running",
          "and your IP is allowed if using a remote host."
        );
      }
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
