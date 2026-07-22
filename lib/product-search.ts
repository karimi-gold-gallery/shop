export type ProductSort = "newest" | "price-asc" | "price-desc";

export type ProductSearchFilters = {
  q?: string;
  categorySlugs: string[];
  sort: ProductSort;
};

export function parseCategorySlugs(category?: string | string[]): string[] {
  if (!category) return [];
  const raw = Array.isArray(category) ? category.join(",") : category;
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

export function parseProductSort(sort?: string): ProductSort {
  if (sort === "price-asc" || sort === "price-desc") return sort;
  return "newest";
}

export function parseProductSearchParams(params: {
  q?: string;
  category?: string | string[];
  sort?: string;
}): ProductSearchFilters {
  return {
    q: params.q?.trim() || undefined,
    categorySlugs: parseCategorySlugs(params.category),
    sort: parseProductSort(params.sort),
  };
}

export function buildProductsSearchParams(
  filters: ProductSearchFilters,
  page?: number
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categorySlugs.length > 0) params.set("category", filters.categorySlugs.join(","));
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (page && page > 1) params.set("page", String(page));
  return params;
}

export function buildProductsUrl(filters: ProductSearchFilters, page?: number): string {
  const params = buildProductsSearchParams(filters, page);
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function hasActiveProductFilters(filters: ProductSearchFilters): boolean {
  return (
    Boolean(filters.q) ||
    filters.categorySlugs.length > 0 ||
    filters.sort !== "newest"
  );
}
