import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../lib/db/schema";

const { categories, productImages, products, users } = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function svgImage(label: string, variant: string): { data: Buffer; mimeType: string } {
  const palettes: Record<string, [string, string]> = {
    ring: ["#d4af37", "#8a6a2e"],
    necklace: ["#e6c668", "#a98330"],
    bracelet: ["#c9a14a", "#7a5a20"],
    bangle: ["#dab85c", "#8a651e"],
    earrings: ["#e3c46b", "#b98f2f"],
    chain: ["#caa84a", "#836018"],
  };
  const [c1, c2] = palettes[variant] ?? palettes.ring;
  const shapes: Record<string, string> = {
    ring: `<circle cx="300" cy="200" r="90" fill="none" stroke="url(#g)" stroke-width="34"/><circle cx="300" cy="200" r="90" fill="none" stroke="#fff7e0" stroke-width="6" opacity="0.5"/>`,
    necklace: `<path d="M150 150 Q300 320 450 150" fill="none" stroke="url(#g)" stroke-width="14"/><circle cx="300" cy="265" r="26" fill="url(#g)"/>`,
    bracelet: `<path d="M170 200 Q300 110 430 200 Q300 290 170 200 Z" fill="none" stroke="url(#g)" stroke-width="20"/>`,
    bangle: `<circle cx="300" cy="200" r="100" fill="none" stroke="url(#g)" stroke-width="26"/>`,
    earrings: `<circle cx="220" cy="180" r="34" fill="none" stroke="url(#g)" stroke-width="12"/><circle cx="380" cy="180" r="34" fill="none" stroke="url(#g)" stroke-width="12"/><circle cx="220" cy="180" r="10" fill="url(#g)"/><circle cx="380" cy="180" r="10" fill="url(#g)"/>`,
    chain: `<path d="M120 200 L170 160 L220 200 L270 160 L320 200 L370 160 L420 200 L470 160" fill="none" stroke="url(#g)" stroke-width="10"/>`,
  };
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#fffdf8"/>
      <stop offset="1" stop-color="#efe2c6"/>
    </radialGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)"/>
  ${shapes[variant] ?? shapes.ring}
  <text x="300" y="350" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="30" fill="#2a241c" font-weight="bold">${label}</text>
</svg>`;
  return { data: Buffer.from(svg, "utf8"), mimeType: "image/svg+xml" };
}

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db
    .insert(users)
    .values({
      username: adminUsername,
      passwordHash,
      role: "ADMIN",
      onboarded: true,
      firstName: "مدیر",
      lastName: "کریمی",
      phone: "09120000000",
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { role: "ADMIN", onboarded: true, passwordHash },
    });

  const categoriesData = [
    { name: "انگشتر", slug: "ring", description: "انگشترهای طلای زنانه و مردانه" },
    { name: "گردنبند", slug: "necklace", description: "گردنبندهای طلای طراحی" },
    { name: "دستبند", slug: "bracelet", description: "دستبندهای طلای ظریف" },
    { name: "النگو", slug: "bangle", description: "النگوهای طلای کلاسیک و مدرن" },
    { name: "گوشواره", slug: "earrings", description: "گوشواره‌های طلای متنوع" },
    { name: "زنجیر", slug: "chain", description: "زنجیرهای طلای با کیفیت" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categoriesData) {
    const [cat] = await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: c.name, description: c.description },
      })
      .returning({ id: categories.id });
    categoryIds[c.slug] = cat!.id;
  }

  const seedProducts = [
    {
      name: "انگشتر طلای سلطنتی",
      category: "ring",
      variant: "ring",
      weight: 3.2,
      wage: 850000,
      description: "انگشتر طلای ۱۸ عیار با طراحی سلطنتی و سنگ بدلی ظریف.",
    },
    {
      name: "انگشتر طلای مردانه ساده",
      category: "ring",
      variant: "ring",
      weight: 5.5,
      wage: 1200000,
      description: "انگشتر طلای مردانه با طراحی مینیمال و وزن مناسب.",
    },
    {
      name: "گردنبند طلای قلب",
      category: "necklace",
      variant: "necklace",
      weight: 4.8,
      wage: 1500000,
      description: "گردنبند طلای قلب‌شکل مناسب برای هدیه.",
    },
    {
      name: "گردنبند طلای الماس‌کار",
      category: "necklace",
      variant: "necklace",
      weight: 6.1,
      wage: 2100000,
      description: "گردنبند طلای الماس‌کار با ظرافت بالا.",
    },
    {
      name: "دستبند طلای زنانه ظریف",
      category: "bracelet",
      variant: "bracelet",
      weight: 7.4,
      wage: 1800000,
      description: "دستبند طلای ظریف با طراحی دل‌نشین.",
    },
    {
      name: "دستبند طلای دو ردیف",
      category: "bracelet",
      variant: "bracelet",
      weight: 11.2,
      wage: 2600000,
      description: "دستبند طلای دو ردیف، شیک و مناسب مجالس.",
    },
    {
      name: "النگوی طلای کلاسیک",
      category: "bangle",
      variant: "bangle",
      weight: 14.5,
      wage: 2400000,
      description: "النگوی طلای کلاسیک با وزن بالا و درخشش عالی.",
    },
    {
      name: "النگوی طلای مدرن",
      category: "bangle",
      variant: "bangle",
      weight: 12.8,
      wage: 2200000,
      description: "النگوی طلای مدرن با طراحی متفاوت.",
    },
    {
      name: "گوشواره طلای گل",
      category: "earrings",
      variant: "earrings",
      weight: 2.9,
      wage: 950000,
      description: "گوشواره طلای گل‌شکل، سبک و زیبا.",
    },
    {
      name: "گوشواره طلای چلچراغ",
      category: "earrings",
      variant: "earrings",
      weight: 4.2,
      wage: 1300000,
      description: "گوشواره طلای چلچراغی مجلسی.",
    },
    {
      name: "زنجیر طلای ژول‌کار",
      category: "chain",
      variant: "chain",
      weight: 9.6,
      wage: 1700000,
      description: "زنجیر طلای ژول‌کار درجه یک.",
    },
    {
      name: "زنجیر طلای ونیزی",
      category: "chain",
      variant: "chain",
      weight: 13.3,
      wage: 2500000,
      description: "زنجیر طلای ونیزی با طراحی خاص.",
    },
  ];

  for (const p of seedProducts) {
    const slug = `${p.variant}-${p.name.replace(/\s+/g, "-")}`;
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      columns: { id: true },
    });
    if (existing) continue;

    const [product] = await db
      .insert(products)
      .values({
        name: p.name,
        slug,
        description: p.description,
        weight: p.weight,
        karat: 18,
        wage: p.wage,
        categoryId: categoryIds[p.category]!,
        active: true,
      })
      .returning({ id: products.id });

    const img = svgImage(p.name, p.variant);
    await db.insert(productImages).values({
      productId: product!.id,
      data: img.data,
      mimeType: img.mimeType,
    });
  }

  console.log("✅ Seed completed. Admin:", adminUsername, "/", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
