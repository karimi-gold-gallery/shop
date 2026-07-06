"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, SlidersHorizontal } from "lucide-react";

import {
  buildProductsUrl,
  hasActiveProductFilters,
  parseProductSearchParams,
  type ProductSearchFilters,
  type ProductSort,
} from "@/lib/product-search";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  categories: Category[];
  goldPrice: number;
  filters: ProductSearchFilters;
};

const sortLabels: Record<ProductSort, string> = {
  newest: "جدیدترین",
  "price-asc": "ارزان‌ترین",
  "price-desc": "گران‌ترین",
};

export function ProductFilters({ categories, goldPrice, filters }: Props) {
  const router = useRouter();

  function navigate(next: ProductSearchFilters) {
    router.push(buildProductsUrl(next));
  }

  function updateFilters(patch: Partial<ProductSearchFilters>) {
    navigate({ ...filters, ...patch });
  }

  function toggleCategory(slug: string, checked: boolean) {
    const next = new Set(filters.categorySlugs);
    if (checked) next.add(slug);
    else next.delete(slug);
    updateFilters({ categorySlugs: [...next] });
  }

  const showClear = hasActiveProductFilters(filters);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 font-semibold text-navy mb-3">
          <SlidersHorizontal className="size-4" />
          جستجو
        </div>
        <SearchBox initialValue={filters.q ?? ""} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-semibold text-navy mb-3">مرتب‌سازی</p>
        <Select
          dir="rtl"
          value={filters.sort}
          onValueChange={(value) => updateFilters({ sort: value as ProductSort })}
        >
          <SelectTrigger className="text-right">
            <SelectValue placeholder="مرتب‌سازی" />
          </SelectTrigger>
          <SelectContent dir="rtl" className="text-right">
            {(Object.keys(sortLabels) as ProductSort[]).map((sort) => (
              <SelectItem key={sort} value={sort}>
                {sortLabels[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-semibold text-navy">دسته‌بندی‌ها</p>
          {filters.categorySlugs.length > 0 && (
            <button
              type="button"
              onClick={() => updateFilters({ categorySlugs: [] })}
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              پاک کردن
            </button>
          )}
        </div>

        <ul className="overflow-hidden rounded-lg border border-border/70 divide-y divide-border">
          {categories.map((category) => {
            const checked = filters.categorySlugs.includes(category.slug);
            return (
              <li key={category.id}>
                <button
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleCategory(category.slug, !checked)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3.5 py-3 text-sm transition-colors",
                    checked
                      ? "bg-accent/45 text-navy"
                      : "bg-card text-foreground/80 hover:bg-secondary/45"
                  )}
                >
                  <span className={cn("text-right", checked && "font-medium")}>
                    {category.name}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background"
                    )}
                  >
                    {checked && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm">
        <p className="text-muted-foreground">قیمت روز طلا (هر گرم):</p>
        <p className="font-bold text-navy mt-1">
          {toPersianDigits(formatNumber(goldPrice))} تومان
        </p>
      </div>

      {showClear && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/products")}
        >
          پاک کردن فیلترها
        </Button>
      )}
    </div>
  );
}

export function ProductFiltersMobileTrigger({
  categories,
  goldPrice,
}: Omit<Props, "filters">) {
  const searchParams = useSearchParams();
  const filters = parseProductSearchParams({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  return (
    <details className="lg:hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-navy [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          فیلترها
          {hasActiveProductFilters(filters) && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
              فعال
            </span>
          )}
        </span>
      </summary>
      <div className="border-t border-border p-4">
        <ProductFilters
          categories={categories}
          goldPrice={goldPrice}
          filters={filters}
        />
      </div>
    </details>
  );
}
