import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";

import { getCategories, getFilteredProductsPage } from "@/lib/products";
import { getViewerPricing } from "@/lib/pricing";
import { parseProductSearchParams, buildProductsUrl } from "@/lib/product-search";
import { parsePageParam } from "@/lib/pagination";
import { ProductCard } from "@/components/product-card";
import { PersonalDiscountNotice } from "@/components/personal-discount-notice";
import { ProductFilters, ProductFiltersMobileTrigger } from "@/components/product-filters";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "محصولات" };

type SearchParams = Promise<{
  q?: string;
  category?: string | string[];
  sort?: string;
  page?: string;
}>;

function filtersSummary(
  filters: ReturnType<typeof parseProductSearchParams>,
  categories: { slug: string; name: string }[]
) {
  if (filters.q) return `نتایج جستجو برای «${filters.q}»`;
  if (filters.categorySlugs.length > 0) {
    const names = filters.categorySlugs
      .map((slug) => categories.find((c) => c.slug === slug)?.name ?? slug)
      .join("، ");
    return `دسته‌بندی‌ها: ${names}`;
  }
  return "همه محصولات گالری کریمی";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const filters = parseProductSearchParams(raw);
  const page = parsePageParam(raw.page);

  const [categories, { goldPrices, discountPercent }] = await Promise.all([
    getCategories(),
    getViewerPricing(),
  ]);
  const { products, pagination } = await getFilteredProductsPage(
    filters,
    goldPrices,
    page
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1">محصولات</h1>
        <p className="text-sm text-muted-foreground">{filtersSummary(filters, categories)}</p>
      </div>

      <PersonalDiscountNotice discountPercent={discountPercent} className="mb-6" />

      <Suspense fallback={null}>
        <div className="mb-6">
          <ProductFiltersMobileTrigger categories={categories} goldPrices={goldPrices} />
        </div>
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={null}>
          <div className="hidden lg:block">
            <ProductFilters
              categories={categories}
              goldPrices={goldPrices}
              filters={filters}
            />
          </div>
        </Suspense>

        <section>
          {pagination.total === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card py-24 text-center">
              <SearchX className="size-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-navy">محصولی یافت نشد</p>
              <p className="text-sm text-muted-foreground mt-1">
                عبارت جستجو یا فیلترهای دیگری را امتحان کنید.
              </p>
              <Link href="/products" className="mt-4">
                <Badge variant="secondary" className="px-4 py-2 cursor-pointer">
                  نمایش همه محصولات
                </Badge>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {toPersianDigits(pagination.total)} محصول یافت شد
              </p>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    goldPrices={goldPrices}
                    discountPercent={discountPercent}
                  />
                ))}
              </div>
              <PaginationControls
                className="mt-8"
                pagination={pagination}
                itemLabel="محصول"
                hrefForPage={(p) => buildProductsUrl(filters, p)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
