import Link from "next/link";
import type { Metadata } from "next";
import { SlidersHorizontal, SearchX } from "lucide-react";

import { getProducts, getCategories } from "@/lib/products";
import { getGoldPricePerGram } from "@/lib/gold-price";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { toPersianDigits } from "@/lib/format";

export const metadata: Metadata = { title: "محصولات" };

type SearchParams = Promise<{ q?: string; category?: string }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, category } = await searchParams;
  const [products, categories, goldPrice] = await Promise.all([
    getProducts({ q, categorySlug: category }),
    getCategories(),
    getGoldPricePerGram(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1">محصولات</h1>
        <p className="text-sm text-muted-foreground">
          {activeCategory
            ? `دسته‌بندی: ${activeCategory.name}`
            : q
            ? `نتایج جستجو برای «${q}»`
            : "همه محصولات گالری کریمی"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-semibold text-navy mb-3">
              <SlidersHorizontal className="size-4" />
              جستجو
            </div>
            <SearchBox initialValue={q ?? ""} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-navy mb-3">دسته‌بندی‌ها</p>
            <div className="flex flex-col gap-1.5">
              <Link
                href={`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${!category ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                همه دسته‌ها
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm">
            <p className="text-muted-foreground">قیمت روز طلا (هر گرم):</p>
            <p className="font-bold text-navy mt-1">
              {toPersianDigits(new Intl.NumberFormat("fa-IR").format(goldPrice))} تومان
            </p>
          </div>
        </aside>

        {/* Products grid */}
        <section>
          {products.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card py-24 text-center">
              <SearchX className="size-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-navy">محصولی یافت نشد</p>
              <p className="text-sm text-muted-foreground mt-1">
                عبارت جستجو یا دسته‌بندی دیگری را امتحان کنید.
              </p>
              <Link href="/products" className="mt-4">
                <Badge variant="secondary" className="px-4 py-2 cursor-pointer">نمایش همه محصولات</Badge>
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
