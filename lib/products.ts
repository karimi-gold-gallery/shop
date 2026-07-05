import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  weight: true,
  wage: true,
  active: true,
  categoryId: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: { select: { id: true, mimeType: true }, take: 1 },
} as const;

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  weight: number;
  wage: number;
  active: boolean;
  categoryId: string;
  createdAt: Date;
  category: { id: string; name: string; slug: string };
  images: { id: string; mimeType: string }[];
};

export async function getProducts(opts: {
  q?: string;
  categorySlug?: string;
  limit?: number;
  onlyActive?: boolean;
}): Promise<ProductCardData[]> {
  const { q, categorySlug, limit, onlyActive = true } = opts;

  const where: Prisma.ProductWhereInput = {};
  if (onlyActive) where.active = true;
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
    ];
  }

  return prisma.product.findMany({
    where,
    select: productSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    select: {
      ...productSelect,
      images: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  });
}
