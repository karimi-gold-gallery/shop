import type { Metadata } from "next";

import { asc, count } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { AdminCategories } from "@/components/admin-categories";

export const metadata: Metadata = { title: "مدیریت دسته‌بندی‌ها" };

export default async function AdminCategoriesPage() {
  const [rows, productCounts] = await Promise.all([
    db.query.categories.findMany({ orderBy: asc(categories.name) }),
    db
      .select({ categoryId: products.categoryId, value: count() })
      .from(products)
      .groupBy(products.categoryId),
  ]);

  const countByCategory = new Map(
    productCounts.map((row) => [row.categoryId, row.value])
  );

  const data = rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    count: countByCategory.get(c.id) ?? 0,
  }));

  return <AdminCategories categories={data} />;
}
