import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../lib/db/schema";

const { users } = schema;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const firstNames = [
  "علی", "مریم", "حسین", "زهرا", "محمد", "فاطمه", "رضا", "سارا", "امیر", "نرگس",
  "مهدی", "نیلوفر", "پارسا", "مینا", "کیان", "هانیه", "آرین", "یاسمن", "سینا", "الناز",
  "آرمان", "شیدا", "بهراد", "پردیس", "نیما", "گلناز", "سامان", "آتنا", "پویا", "مهسا",
];

const lastNames = [
  "احمدی", "محمدی", "رضایی", "حسینی", "کریمی", "موسوی", "جعفری", "نوری", "صادقی", "کاظمی",
  "حیدری", "باقری", "طاهری", "اکبری", "مرادی", "شریفی", "رحیمی", "عباسی", "نژاد", "فرهادی",
  "ایمانی", "پناهی", "سلطانی", "جمشیدی", "یوسفی", "قاسمی", "اسدی", "نیکو", "رستمی", "داودی",
];

const cities = [
  "تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج", "اهواز", "قم", "رشت", "کرمان",
];

async function main() {
  const passwordHash = await bcrypt.hash("User12345", 10);
  let created = 0;
  let skipped = 0;

  for (let i = 1; i <= 30; i++) {
    const username = `user${String(i).padStart(2, "0")}`;
    const existing = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const firstName = firstNames[i - 1];
    const lastName = lastNames[i - 1];
    const gender = i % 2 === 0 ? "FEMALE" : "MALE";
    const phone = `0912${String(1000000 + i).slice(1)}`;

    await db.insert(users).values({
      username,
      passwordHash,
      role: "CUSTOMER",
      firstName,
      lastName,
      birthDate: `۱۳۷${i % 10}/0${(i % 9) + 1}/1${i % 9}`,
      gender,
      phone,
      city: cities[(i - 1) % cities.length],
      onboarded: true,
    });
    created += 1;
  }

  console.log(`✅ Users seed done. created=${created}, skipped=${skipped}`);
  console.log("Login example: user01 / User12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
