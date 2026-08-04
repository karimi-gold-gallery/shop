const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const { createId } = require("@paralleldrive/cuid2");

function slugify(input) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const random = Math.random().toString(36).slice(2, 7);
  return `${base || "item"}-${random}`;
}

function detectMimeType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const category = await pool.query(
    `SELECT "id"
     FROM "Category"
     ORDER BY "createdAt" DESC
     LIMIT 1;`
  );
  if (category.rows.length === 0) {
    throw new Error("No categories found. Create a category first.");
  }

  const categoryId = category.rows[0].id;

  const groupName = "محصول نمونه چندرنگ (تست)";
  const description = "این محصول به‌صورت نمونه برای تست انتخاب رنگ و وزن ساخته شده است.";
  const karat = 18;
  const wage = 250000; // toman

  // 2 colors × 2 weights
  const variants = [
    { color: "طلایی", weight: 2.5, image: "logo.png" },
    { color: "طلایی", weight: 3.2, image: "vercel.svg" },
    { color: "نقره‌ای", weight: 2.5, image: "file.svg" },
    { color: "نقره‌ای", weight: 3.2, image: "window.svg" },
  ];

  const publicDir = path.join(process.cwd(), "public");

  const insertedProductSlugs = [];

  await pool.query("BEGIN");
  try {
    for (const v of variants) {
      // Avoid duplicates if you re-run the script.
      const existing = await pool.query(
        `SELECT "id", "slug"
         FROM "Product"
         WHERE "name" = $1
           AND "categoryId" = $2
           AND "karat" = $3
           AND "active" = true
           AND (("color" = $4) OR ("color" IS NULL AND $4 IS NULL))
           AND "weight" = $5
         LIMIT 1;`,
        [groupName, categoryId, karat, v.color, v.weight]
      );

      if (existing.rows.length > 0) {
        insertedProductSlugs.push(existing.rows[0].slug);
        continue;
      }

      const productId = createId();
      const slug = slugify(groupName);

      await pool.query(
        `INSERT INTO "Product"
          ("id","name","slug","description","color","weight","karat","wage","active","categoryId","createdAt","updatedAt")
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11);`,
        [
          productId,
          groupName,
          slug,
          description,
          v.color,
          v.weight,
          karat,
          wage,
          categoryId,
          new Date(),
          new Date(),
        ]
      );

      const imagePath = path.join(publicDir, v.image);
      const data = fs.readFileSync(imagePath);
      const mimeType = detectMimeType(v.image);

      const imageId = createId();
      await pool.query(
        `INSERT INTO "ProductImage"
          ("id","productId","data","mimeType")
         VALUES
          ($1,$2,$3,$4);`,
        [imageId, productId, data, mimeType]
      );

      insertedProductSlugs.push(slug);
    }

    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  } finally {
    await pool.end();
  }

  console.log("Inserted/kept product variants. Slugs:");
  for (const s of insertedProductSlugs) console.log("-", s);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

