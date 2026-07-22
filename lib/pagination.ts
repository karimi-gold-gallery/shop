import { toEnglishDigits } from "@/lib/format";

export const DEFAULT_PAGE_SIZE = 20;
export const PRODUCTS_PAGE_SIZE = 12;
export const PROFILE_ORDERS_PAGE_SIZE = 10;

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** 1-based index of first item on this page (0 when empty). */
  from: number;
  /** 1-based index of last item on this page (0 when empty). */
  to: number;
};

export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const n = Number.parseInt(toEnglishDigits(raw), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function buildPagination(
  pageInput: number,
  total: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): Pagination {
  const size = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, pageInput), totalPages);
  const skip = (page - 1) * size;
  const from = total === 0 ? 0 : skip + 1;
  const to = total === 0 ? 0 : Math.min(skip + size, total);

  return {
    page,
    pageSize: size,
    skip,
    take: size,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    from,
    to,
  };
}

/** Build a URL for a page while preserving other query params. */
export function buildPagedHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) params.append(key, item);
      }
    } else if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
