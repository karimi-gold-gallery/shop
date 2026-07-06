import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeProductPrice } from "@/lib/gold-price";
import type { ProductSearchFilters, ProductSort } from "@/lib/product-search";

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
  categorySlugs?: string[];
  sort?: ProductSort;
  goldPricePerGram?: number;
  limit?: number;
  onlyActive?: boolean;
}): Promise<ProductCardData[]> {
  const {
    q,
    categorySlug,
    categorySlugs = categorySlug ? [categorySlug] : [],
    sort = "newest",
    goldPricePerGram,
    limit,
    onlyActive = true,
  } = opts;

  const where: Prisma.ProductWhereInput = {};
  if (onlyActive) where.active = true;
  if (categorySlugs.length > 0) {
    where.category = { slug: { in: categorySlugs } };
  }
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    select: productSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const needsPriceProcessing =
    goldPricePerGram !== undefined && sort !== "newest";

  if (!needsPriceProcessing) return products;

  let priced = products.map((product) => ({
    product,
    price: computeProductPrice(product.weight, product.wage, goldPricePerGram!),
  }));

  if (sort === "price-asc") {
    priced.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    priced.sort((a, b) => b.price - a.price);
  }

  return priced.map(({ product }) => product);
}

export async function getFilteredProducts(
  filters: ProductSearchFilters,
  goldPricePerGram: number
): Promise<ProductCardData[]> {
  return getProducts({
    q: filters.q,
    categorySlugs: filters.categorySlugs,
    sort: filters.sort,
    goldPricePerGram,
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
