CREATE TABLE IF NOT EXISTS "GoldPrice" (
  "karat" integer PRIMARY KEY NOT NULL,
  "pricePerGram" double precision NOT NULL,
  "sourcePriceRial" double precision NOT NULL,
  "sourceTime" text NOT NULL,
  "syncedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "GoldPrice_karat_check" CHECK ("GoldPrice"."karat" in (18, 24)),
  CONSTRAINT "GoldPrice_price_check" CHECK ("GoldPrice"."pricePerGram" > 0)
);
--> statement-breakpoint
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "karat" integer DEFAULT 18 NOT NULL;
--> statement-breakpoint
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "karat" integer DEFAULT 18 NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_karat_check'
  ) THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_karat_check" CHECK ("karat" in (18, 24));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_karat_check'
  ) THEN
    ALTER TABLE "OrderItem"
      ADD CONSTRAINT "OrderItem_karat_check" CHECK ("karat" in (18, 24));
  END IF;
END $$;
--> statement-breakpoint
DELETE FROM "Setting" WHERE "key" = 'goldPricePerGram';
