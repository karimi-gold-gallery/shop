import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { AdminCategories } from "@/components/admin-categories";

export const metadata: Metadata = { title: "مدیریت دسته‌بندی‌ها" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    count: c._count.products,
  }));

  return <AdminCategories categories={data} />;
}
