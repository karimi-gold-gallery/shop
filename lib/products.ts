import { and, asc, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import {
  goldPriceForKarat,
  type GoldPriceMap,
} from "@/lib/gold-prices";
import { computeProductPrice } from "@/lib/pricing";
import type { ProductSearchFilters, ProductSort } from "@/lib/product-search";
import {
  buildPagination,
  PRODUCTS_PAGE_SIZE,
  type Pagination,
} from "@/lib/pagination";

/** Columns every product listing needs, plus its category and a cover image. */
export const productColumns = {
  id: true,
  name: true,
  slug: true,
  description: true,
  color: true,
  weight: true,
  karat: true,
  wage: true,
  active: true,
  categoryId: true,
  createdAt: true,
} as const;

const categoryColumns = { id: true, name: true, slug: true } as const;
const imageColumns = { id: true, mimeType: true } as const;

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  weight: number;
  karat: number;
  wage: number;
  active: boolean;
  categoryId: string;
  createdAt: Date;
  category: { id: string; name: string; slug: string };
  images: { id: string; mimeType: string }[];
};

/** Escape LIKE wildcards so a search term is always matched literally. */
function likePattern(term: string): string {
  return `%${term.replace(/([\\%_])/g, "\\$1")}%`;
}

function buildProductWhere(opts: {
  q?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  onlyActive?: boolean;
}): SQL | undefined {
  const {
    q,
    categorySlug,
    categorySlugs = categorySlug ? [categorySlug] : [],
    onlyActive = true,
  } = opts;

  const conditions: SQL[] = [];
  if (onlyActive) conditions.push(eq(products.active, true));
  if (categorySlugs.length > 0) {
    conditions.push(
      inArray(
        products.categoryId,
        db
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.slug, categorySlugs))
      )
    );
  }
  if (q && q.trim()) {
    const pattern = likePattern(q.trim());
    conditions.push(
      or(like(products.name, pattern), like(products.description, pattern))!
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getProducts(opts: {
  q?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  sort?: ProductSort;
  goldPrices?: GoldPriceMap;
  limit?: number;
  onlyActive?: boolean;
}): Promise<ProductCardData[]> {
  const {
    q,
    categorySlug,
    categorySlugs = categorySlug ? [categorySlug] : [],
    sort = "newest",
    goldPrices,
    limit,
    onlyActive = true,
  } = opts;

  const where = buildProductWhere({ q, categorySlug, categorySlugs, onlyActive });

  // Group by `name` so multiple variant rows (different color/weight) appear
  // as a single card on listing pages.
  const variantLimit = limit ? limit * 8 : undefined;
  const found = await db.query.products.findMany({
    where,
    columns: productColumns,
    with: {
      category: { columns: categoryColumns },
      images: {
        columns: imageColumns,
        limit: 1,
        orderBy: (image, { asc: ascending }) => ascending(image.createdAt),
      },
    },
    orderBy: desc(products.createdAt),
    limit: variantLimit,
  });

  const groups = new Map<string, ProductCardData[]>();
  for (const p of found) {
    const list = groups.get(p.name) ?? [];
    list.push(p);
    groups.set(p.name, list);
  }

  const needsPriceProcessing = goldPrices !== undefined && sort !== "newest";

  const groupReps = Array.from(groups.entries()).map(([name, variants]) => {
    if (!needsPriceProcessing) {
      const rep = variants.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]!;
      return { rep, sortValue: rep.createdAt.getTime() };
    }

    const pricedVariants = variants.map((v) => ({
      v,
      price: computeProductPrice(
        v.weight,
        v.wage,
        goldPriceForKarat(goldPrices!, v.karat)
      ),
    }));

    const sorted = pricedVariants.sort((a, b) =>
      sort === "price-asc" ? a.price - b.price : b.price - a.price
    );
    const rep = sorted[0]!.v;
    const sortValue = sorted[0]!.price;
    return { rep, sortValue };
  });

  groupReps.sort((a, b) => {
    if (sort === "newest") return b.sortValue - a.sortValue;
    return sort === "price-asc" ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
  });

  const out = groupReps.map(({ rep }) => rep);
  if (!limit) return out;
  return out.slice(0, limit);
}

export async function getFilteredProductsPage(
  filters: ProductSearchFilters,
  goldPrices: GoldPriceMap,
  pageInput: number,
  pageSize: number = PRODUCTS_PAGE_SIZE
): Promise<{ products: ProductCardData[]; pagination: Pagination }> {
  const where = buildProductWhere({
    q: filters.q,
    categorySlugs: filters.categorySlugs,
    onlyActive: true,
  });
  // For grouped listing we compute total + pagination in JS by grouping variants by name.
  // This is more correct for your variant model (multiple Product rows = one visible product).
  const all = await db.query.products.findMany({
    where,
    columns: productColumns,
    with: {
      category: { columns: categoryColumns },
      images: {
        columns: imageColumns,
        limit: 1,
        orderBy: (image, { asc: ascending }) => ascending(image.createdAt),
      },
    },
  });

  const groups = new Map<string, ProductCardData[]>();
  for (const p of all) {
    const list = groups.get(p.name) ?? [];
    list.push(p);
    groups.set(p.name, list);
  }

  const groupReps = Array.from(groups.values()).map((variants) => {
    if (filters.sort === "newest") {
      const rep = variants.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]!;
      return { rep, sortValue: rep.createdAt.getTime() };
    }

    const pricedVariants = variants.map((v) => ({
      v,
      price: computeProductPrice(
        v.weight,
        v.wage,
        goldPriceForKarat(goldPrices, v.karat)
      ),
    }));

    const sorted = pricedVariants.sort((a, b) =>
      filters.sort === "price-asc" ? a.price - b.price : b.price - a.price
    );
    const rep = sorted[0]!.v;
    const sortValue = sorted[0]!.price;
    return { rep, sortValue };
  });

  groupReps.sort((a, b) => {
    if (filters.sort === "newest") return b.sortValue - a.sortValue;
    return filters.sort === "price-asc" ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
  });

  const totalGroups = groupReps.length;
  const pagination = buildPagination(pageInput, totalGroups, pageSize);
  if (totalGroups === 0) return { products: [], pagination };

  const page = groupReps
    .slice(pagination.skip, pagination.skip + pagination.take)
    .map(({ rep }) => rep);

  return { products: page, pagination };
}

export async function getFilteredProducts(
  filters: ProductSearchFilters,
  goldPrices: GoldPriceMap
): Promise<ProductCardData[]> {
  return getProducts({
    q: filters.q,
    categorySlugs: filters.categorySlugs,
    sort: filters.sort,
    goldPrices,
  });
}

export async function getProductVariantsBySlug(slug: string) {
  const primary = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true)),
    columns: { id: true, name: true },
  });

  if (!primary) return [];

  return db.query.products.findMany({
    where: and(eq(products.name, primary.name), eq(products.active, true)),
    columns: productColumns,
    with: {
      category: { columns: categoryColumns },
      images: {
        columns: imageColumns,
        orderBy: (image, { asc: ascending }) => ascending(image.createdAt),
      },
    },
    orderBy: desc(products.createdAt),
  });
}

/** Representative variant for legacy/metadata use-cases. */
export async function getProductBySlug(slug: string) {
  const variants = await getProductVariantsBySlug(slug);
  return variants[0] ?? null;
}

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: asc(categories.name),
    columns: { id: true, name: true, slug: true, description: true },
  });
}
