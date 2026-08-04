import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { getProductVariantsBySlug, getProducts } from "@/lib/products";
import { getViewerPricing } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { ProductDetailInteractive } from "@/components/product-detail-interactive";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = safeDecodeSlug(rawSlug);
  const variants = await getProductVariantsBySlug(slug);
  const primary = variants[0];
  if (!primary) return { title: "محصول یافت نشد" };
  return { title: primary.name, description: primary.description ?? undefined };
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

  const [variants, { goldPrices, discountPercent }, user] = await Promise.all([
    getProductVariantsBySlug(slug),
    getViewerPricing(),
    getCurrentUser(),
  ]);

  const primary = variants[0];
  if (!primary) notFound();

  const isAdmin = user?.role === "ADMIN";

  const related = (await getProducts({ categorySlug: primary.category.slug, limit: 5 }))
    .filter((p) => p.name !== primary.name)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-navy">خانه</Link>
        <ChevronLeft className="size-4" />
        <Link href="/products" className="hover:text-navy">محصولات</Link>
        <ChevronLeft className="size-4" />
        <Link href={`/products?category=${primary.category.slug}`} className="hover:text-navy">
          {primary.category.name}
        </Link>
        <ChevronLeft className="size-4" />
        <span className="text-navy font-medium">{primary.name}</span>
      </nav>

      <ProductDetailInteractive
        variants={variants}
        goldPrices={goldPrices}
        discountPercent={discountPercent}
        isAdmin={isAdmin}
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-navy mb-5">محصولات مرتبط</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                goldPrices={goldPrices}
                discountPercent={discountPercent}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
