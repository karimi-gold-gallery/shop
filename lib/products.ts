import { and, asc, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";

import { countRows, db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { computeProductPrice } from "@/lib/gold-price";
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
  weight: true,
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
  weight: number;
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

  const found = await db.query.products.findMany({
    where,
    columns: productColumns,
    with: {
      category: { columns: categoryColumns },
      images: { columns: imageColumns, limit: 1 },
    },
    orderBy: desc(products.createdAt),
    limit,
  });

  const needsPriceProcessing =
    goldPricePerGram !== undefined && sort !== "newest";

  if (!needsPriceProcessing) return found;

  const priced = found.map((product) => ({
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

  const total = await countRows(products, where);
  const pagination = buildPagination(pageInput, total, pageSize);

  if (total === 0) {
    return { products: [], pagination };
  }

  let page: ProductCardData[];

  if (filters.sort === "newest") {
    page = await db.query.products.findMany({
      where,
      columns: productColumns,
      with: {
        category: { columns: categoryColumns },
        images: { columns: imageColumns, limit: 1 },
      },
      orderBy: desc(products.createdAt),
      offset: pagination.skip,
      limit: pagination.take,
    });
  } else {
    // Price sort is computed from weight/wage + live gold price — page in DB by id order after ranking.
    const ranked = await db.query.products.findMany({
      where,
      columns: { id: true, weight: true, wage: true },
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

    const fetched = await db.query.products.findMany({
      where: inArray(products.id, pageIds),
      columns: productColumns,
      with: {
        category: { columns: categoryColumns },
        images: { columns: imageColumns, limit: 1 },
      },
    });
    const byId = new Map(fetched.map((p) => [p.id, p]));
    page = pageIds
      .map((id) => byId.get(id))
      .filter((p): p is ProductCardData => Boolean(p));
  }

  return { products: page, pagination };
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
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: productColumns,
    with: {
      category: { columns: categoryColumns },
      images: {
        columns: imageColumns,
        orderBy: (image, { asc: ascending }) => ascending(image.createdAt),
      },
    },
  });
  return product ?? null;
}

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: asc(categories.name),
    columns: { id: true, name: true, slug: true, description: true },
  });
}
