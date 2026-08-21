import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Table/column names are written out explicitly in the schema (PascalCase
  // tables, camelCase columns) so no casing strategy is applied here.
  verbose: true,
  strict: true,
});
