import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";

import { getCategories, getFilteredProducts } from "@/lib/products";
import { getGoldPricePerGram } from "@/lib/gold-price";
import { parseProductSearchParams } from "@/lib/product-search";
import { ProductCard } from "@/components/product-card";
import { ProductFilters, ProductFiltersMobileTrigger } from "@/components/product-filters";
import { Badge } from "@/components/ui/badge";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "محصولات" };

type SearchParams = Promise<{
  q?: string;
  category?: string | string[];
  sort?: string;
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

  const [categories, goldPrice] = await Promise.all([
    getCategories(),
    getGoldPricePerGram(),
  ]);
  const products = await getFilteredProducts(filters, goldPrice);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1">محصولات</h1>
        <p className="text-sm text-muted-foreground">{filtersSummary(filters, categories)}</p>
      </div>

      <Suspense fallback={null}>
        <div className="mb-6">
          <ProductFiltersMobileTrigger categories={categories} goldPrice={goldPrice} />
        </div>
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={null}>
          <div className="hidden lg:block">
            <ProductFilters
              categories={categories}
              goldPrice={goldPrice}
              filters={filters}
            />
          </div>
        </Suspense>

        <section>
          {products.length === 0 ? (
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
                {toPersianDigits(products.length)} محصول یافت شد
              </p>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} goldPrice={goldPrice} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
