"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Layers, ShoppingBag, Tag, Weight } from "lucide-react";

import type { GoldPriceMap } from "@/lib/gold-prices";
import { formatGram, formatPercent, formatToman, toPersianDigits } from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProductCardData } from "@/lib/products";

type VariantProduct = ProductCardData;

function normalizeDiscountPercentClient(percent: number): number {
  if (typeof percent !== "number" || !Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

export function ProductDetailInteractive({
  variants,
  goldPrices,
  discountPercent,
  isAdmin,
}: {
  variants: VariantProduct[];
  goldPrices: GoldPriceMap;
  discountPercent: number;
  isAdmin: boolean;
}) {
  const colorKey = (v: VariantProduct) => (v.color?.trim() ? v.color.trim() : "__DEFAULT__");

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) set.add(colorKey(v));
    return Array.from(set);
  }, [variants]);

  const initialColor = colorOptions[0] ?? "__DEFAULT__";
  const initialWeights = useMemo(() => {
    return variants
      .filter((v) => colorKey(v) === initialColor)
      .map((v) => v.weight);
  }, [variants, initialColor]);

  const initialWeight = useMemo(() => {
    const uniq = Array.from(new Set(initialWeights));
    uniq.sort((a, b) => a - b);
    return uniq[0] ?? null;
  }, [initialWeights]);

  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(initialWeight);

  const variantsForSelectedColor = useMemo(() => {
    return variants.filter((v) => colorKey(v) === selectedColor);
  }, [variants, selectedColor]);

  const weightOptions = useMemo(() => {
    const uniq = Array.from(new Set(variantsForSelectedColor.map((v) => v.weight)));
    uniq.sort((a, b) => a - b);
    return uniq;
  }, [variantsForSelectedColor]);

  useEffect(() => {
    if (selectedWeight !== null && weightOptions.includes(selectedWeight)) return;
    setSelectedWeight(weightOptions[0] ?? null);
  }, [selectedColor, weightOptions, selectedWeight]);

  const selectedVariant =
    variants.find((v) => colorKey(v) === selectedColor && v.weight === selectedWeight) ??
    variantsForSelectedColor[0] ??
    variants[0];

  const hasColorVariants = colorOptions.length > 1;
  const hasWeightVariants = weightOptions.length > 1;

  const discount = normalizeDiscountPercentClient(discountPercent);
  const goldPrice = goldPrices[selectedVariant.karat as keyof GoldPriceMap];
  const basePrice = selectedVariant.weight * goldPrice + selectedVariant.wage;
  const price = basePrice * (1 - discount / 100);
  const discountAmount = basePrice - price;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ProductImageGallery
        key={selectedVariant.id}
        images={selectedVariant.images}
        alt={selectedVariant.name}
      />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="gold">{selectedVariant.category.name}</Badge>
          <Badge variant="secondary">طلای {toPersianDigits(selectedVariant.karat)} عیار</Badge>
          {selectedVariant.color && selectedVariant.color.trim() && (
            <Badge variant="secondary" className="text-muted-foreground">
              رنگ: {selectedVariant.color}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-navy">{selectedVariant.name}</h1>

        {selectedVariant.description && (
          <p className="text-sm leading-7 text-muted-foreground">{selectedVariant.description}</p>
        )}

        <Card className="p-5">
          <div className="space-y-5">
            {hasColorVariants && (
              <SelectorBlock
                title="رنگ"
                options={colorOptions.map((k) => ({
                  value: k,
                  label: k === "__DEFAULT__" ? "پیشفرض" : k,
                }))}
                selectedValue={selectedColor}
                onChange={(v) => {
                  setSelectedColor(v);
                }}
              />
            )}

            {hasWeightVariants && (
              <SelectorBlock
                title="وزن"
                options={weightOptions.map((w) => ({
                  value: String(w),
                  label: toPersianDigits(formatGram(w)),
                }))}
                selectedValue={selectedWeight === null ? "" : String(selectedWeight)}
                onChange={(v) => setSelectedWeight(Number(v))}
              />
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Spec icon={<Weight className="size-4 text-primary" />} label="وزن" value={toPersianDigits(formatGram(selectedVariant.weight))} />
              <Spec icon={<Tag className="size-4 text-primary" />} label="اجرت ساخت" value={toPersianDigits(formatToman(selectedVariant.wage))} />
              <Spec icon={<Layers className="size-4 text-primary" />} label="قیمت هر گرم طلا" value={toPersianDigits(formatToman(goldPrice))} />
              <Spec icon={<Weight className="size-4 text-primary" />} label="محاسبه قیمت" value="وزن × قیمت طلا + اجرت" />
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-border pt-4 gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">قیمت نهایی محصول</p>
                {discount > 0 && (
                  <p className="text-sm text-muted-foreground line-through">
                    {toPersianDigits(formatToman(basePrice))}
                  </p>
                )}
                <p className="text-2xl font-extrabold text-navy">
                  {toPersianDigits(formatToman(price))}
                </p>
                {discount > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    شامل {toPersianDigits(formatPercent(discount))}٪ تخفیف اختصاصی شما ({toPersianDigits(formatToman(discountAmount))} تخفیف)
                  </p>
                )}
              </div>

              {isAdmin ? (
                <Button asChild variant="navy" size="lg">
                  <Link href={`/admin/products/${selectedVariant.id}/edit`}>ویرایش در پنل</Link>
                </Button>
              ) : (
                <AddToCartButton productId={selectedVariant.id} variant="gold" size="lg" />
              )}
            </div>
          </div>
        </Card>

        {!isAdmin && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground leading-7">
            <ShoppingBag className="size-4 text-primary inline-block ml-1" />
            برای نهایی کردن سفارش نیازی به پرداخت آنلاین نیست. پس از ثبت سفارش، کد سفارش شما صادر می‌شود؛ با تماس با گالری و اعلام کد، سفارش شما نهایی و تحویل داده می‌شود.
          </div>
        )}
      </div>
    </div>
  );
}

function SelectorBlock({
  title,
  options,
  selectedValue,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === selectedValue;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={selected ? "navy" : "secondary"}
              size="sm"
              className="h-10"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Spec({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-navy">{value}</span>
    </div>
  );
}

