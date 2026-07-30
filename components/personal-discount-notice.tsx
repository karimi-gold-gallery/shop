import { BadgePercent } from "lucide-react";

import { normalizeDiscountPercent } from "@/lib/pricing";
import { formatPercent, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Banner telling a customer that their personal discount is already in the shown prices. */
export function PersonalDiscountNotice({
  discountPercent,
  className,
}: {
  discountPercent: number;
  className?: string;
}) {
  const discount = normalizeDiscountPercent(discountPercent);
  if (discount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-navy",
        className
      )}
    >
      <BadgePercent className="size-5 shrink-0 text-gold" />
      <p className="leading-6">
        تخفیف اختصاصی شما{" "}
        <span className="font-bold">
          {toPersianDigits(formatPercent(discount))}٪
        </span>{" "}
        است و روی قیمت‌های نمایش‌داده‌شده اعمال شده است.
      </p>
    </div>
  );
}
