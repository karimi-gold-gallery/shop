import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ShoppingBag, Weight, Tag, Layers } from "lucide-react";

import { getProductBySlug, getProducts, getCategories } from "@/lib/products";
import { computeBaseProductPrice, computeProductPrice } from "@/lib/gold-price";
import { getViewerPricing } from "@/lib/pricing";
import {
  formatGram,
  formatPercent,
  formatToman,
  toPersianDigits,
} from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول یافت نشد" };
  return { title: product.name, description: product.description ?? undefined };
}

function safeDecodeSlug(slug: string): string {
  try {
    return slug.includes("%") ? decodeURIComponent(slug) : slug;
  } catch {
    return slug;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  const [product, { goldPrice, discountPercent }, categories] = await Promise.all([
    getProductBySlug(slug),
    getViewerPricing(),
    getCategories(),
  ]);

  if (!product || !product.active) notFound();

  const basePrice = computeBaseProductPrice(product.weight, product.wage, goldPrice);
  const price = computeProductPrice(
    product.weight,
    product.wage,
    goldPrice,
    discountPercent
  );
  const mainImage = product.images[0];

  const related = (await getProducts({ categorySlug: product.category.slug, limit: 5 }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-navy">خانه</Link>
        <ChevronLeft className="size-4" />
        <Link href="/products" className="hover:text-navy">محصولات</Link>
        <ChevronLeft className="size-4" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-navy">
          {product.category.name}
        </Link>
        <ChevronLeft className="size-4" />
        <span className="text-navy font-medium">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/50 shadow-sm">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/images/${mainImage.id}`}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">بدون تصویر</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/images/${img.id}`} alt={product.name} className="size-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Badge variant="gold">{product.category.name}</Badge>
            <Badge variant="secondary">طلای ۱۸ عیار</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-navy">{product.name}</h1>

          {product.description && (
            <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>
          )}

          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Spec icon={<Weight className="size-4 text-primary" />} label="وزن" value={toPersianDigits(formatGram(product.weight))} />
              <Spec icon={<Tag className="size-4 text-primary" />} label="اجرت ساخت" value={toPersianDigits(formatToman(product.wage))} />
              <Spec icon={<Layers className="size-4 text-primary" />} label="قیمت هر گرم طلا" value={toPersianDigits(formatToman(goldPrice))} />
              <Spec icon={<Weight className="size-4 text-primary" />} label="محاسبه قیمت" value="وزن × قیمت طلا + اجرت" />
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">قیمت نهایی محصول</p>
                {discountPercent > 0 && (
                  <p className="text-sm text-muted-foreground line-through">
                    {toPersianDigits(formatToman(basePrice))}
                  </p>
                )}
                <p className="text-2xl font-extrabold text-navy">
                  {toPersianDigits(formatToman(price))}
                </p>
                {discountPercent > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    شامل {toPersianDigits(formatPercent(discountPercent))}٪ تخفیف
                    اختصاصی شما ({toPersianDigits(formatToman(basePrice - price))}{" "}
                    تخفیف)
                  </p>
                )}
              </div>
              <AddToCartButton productId={product.id} variant="gold" size="lg" />
            </div>
          </Card>

          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground leading-7">
            <ShoppingBag className="size-4 text-primary inline-block ml-1" />
            برای نهایی کردن سفارش نیازی به پرداخت آنلاین نیست. پس از ثبت سفارش، کد
            سفارش شما صادر می‌شود؛ با تماس با گالری و اعلام کد، سفارش شما نهایی
            و تحویل داده می‌شود.
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-navy mb-5">محصولات مرتبط</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                goldPrice={goldPrice}
                discountPercent={discountPercent}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
