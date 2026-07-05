import Link from "next/link";

import type { ProductCardData } from "@/lib/products";
import { computeProductPrice } from "@/lib/gold-price";
import { formatGram, formatToman, toPersianDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type Props = {
  product: ProductCardData;
  goldPrice: number;
};

export function ProductCard({ product, goldPrice }: Props) {
  const price = computeProductPrice(product.weight, product.wage, goldPrice);
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/60">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${image.id}`}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            بدون تصویر
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="gold" className="shadow-sm">{product.category.name}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-6 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-5">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">
              وزن: {toPersianDigits(formatGram(product.weight))}
            </span>
            <span className="font-bold text-navy text-sm sm:text-base">
              {toPersianDigits(formatToman(price))}
            </span>
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">
            مشاهده
          </span>
        </div>
      </div>
    </Link>
  );
}
