-- Fix failed migration by applying only the delta we need.
-- 1) Add optional "color" column to Product
-- 2) Allow multiple Product rows to share the same "slug" (remove unique index)

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "color" text;

-- Relax slug uniqueness so we can model multi-color / multi-weight variants as
-- multiple rows that share the same slug.
DROP INDEX IF EXISTS "Product_slug_key";

-- Ensure the non-unique index used by the new Drizzle schema exists.
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product" USING btree (slug);

