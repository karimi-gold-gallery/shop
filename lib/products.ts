import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeProductPrice } from "@/lib/gold-price";
import type { ProductSearchFilters, ProductSort } from "@/lib/product-search";
import {
  buildPagination,
  PRODUCTS_PAGE_SIZE,
  type Pagination,
} from "@/lib/pagination";

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

function buildProductWhere(opts: {
  q?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  onlyActive?: boolean;
}): Prisma.ProductWhereInput {
  const {
    q,
    categorySlug,
    categorySlugs = categorySlug ? [categorySlug] : [],
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
  return where;
}

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

  const where = buildProductWhere({ q, categorySlug, categorySlugs, onlyActive });

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

export async function getFilteredProductsPage(
  filters: ProductSearchFilters,
  goldPricePerGram: number,
  pageInput: number,
  pageSize: number = PRODUCTS_PAGE_SIZE
): Promise<{ products: ProductCardData[]; pagination: Pagination }> {
  const where = buildProductWhere({
    q: filters.q,
    categorySlugs: filters.categorySlugs,
    onlyActive: true,
  });

  const total = await prisma.product.count({ where });
  const pagination = buildPagination(pageInput, total, pageSize);

  if (total === 0) {
    return { products: [], pagination };
  }

  let products: ProductCardData[];

  if (filters.sort === "newest") {
    products = await prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });
  } else {
    // Price sort is computed from weight/wage + live gold price — page in DB by id order after ranking.
    const ranked = await prisma.product.findMany({
      where,
      select: { id: true, weight: true, wage: true },
    });

    ranked.sort((a, b) => {
      const pa = computeProductPrice(a.weight, a.wage, goldPricePerGram);
      const pb = computeProductPrice(b.weight, b.wage, goldPricePerGram);
      return filters.sort === "price-asc" ? pa - pb : pb - pa;
    });

    const pageIds = ranked
      .slice(pagination.skip, pagination.skip + pagination.take)
      .map((p) => p.id);

    if (pageIds.length === 0) {
      return { products: [], pagination };
    }

    const fetched = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      select: productSelect,
    });
    const byId = new Map(fetched.map((p) => [p.id, p]));
    products = pageIds
      .map((id) => byId.get(id))
      .filter((p): p is ProductCardData => Boolean(p));
  }

  return { products, pagination };
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
