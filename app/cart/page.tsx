import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getGoldPrices, goldPriceForKarat } from "@/lib/gold-prices";
import { computeProductPrice, getUserDiscountPercent } from "@/lib/pricing";
import {
  formatGram,
  formatPercent,
  formatToman,
  toPersianDigits,
} from "@/lib/format";
import { CartItemRow } from "@/components/cart-item-row";
import { PersonalDiscountNotice } from "@/components/personal-discount-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "سبد خرید" };

export default async function CartPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-navy mb-2">برای مشاهده سبد خرید وارد شوید</h1>
        <p className="text-sm text-muted-foreground mb-6">سبد خرید به حساب کاربری شما متصل است.</p>
        <Button asChild variant="navy"><Link href="/login">ورود / ثبت‌نام</Link></Button>
      </div>
    );
  }

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, user.id),
    with: {
      product: {
        with: { category: true, images: { columns: { id: true }, limit: 1 } },
      },
    },
    orderBy: desc(cartItems.createdAt),
  });

  const goldPrices = await getGoldPrices();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-navy mb-2">سبد خرید شما خالی است</h1>
        <p className="text-sm text-muted-foreground mb-6">محصولات موردعلاقه را به سبد خرید اضافه کنید.</p>
        <Button asChild variant="gold"><Link href="/products">مشاهده محصولات</Link></Button>
      </div>
    );
  }

  const discountPercent = getUserDiscountPercent(user);

  let totalGrams = 0;
  let totalWage = 0;
  let totalPrice = 0;
  let basePrice = 0;

  const rows = items.map((item) => {
    const goldPrice = goldPriceForKarat(goldPrices, item.product.karat);
    const unitPrice = computeProductPrice(
      item.product.weight,
      item.product.wage,
      goldPrice,
      discountPercent
    );
    const lineTotal = unitPrice * item.quantity;
    totalGrams += item.product.weight * item.quantity;
    totalWage += item.product.wage * item.quantity;
    totalPrice += lineTotal;
    basePrice += (item.product.weight * goldPrice + item.product.wage) * item.quantity;
    return { item, unitPrice, lineTotal, goldPrice };
  });

  const discountAmount = basePrice - totalPrice;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-6">سبد خرید</h1>

      <PersonalDiscountNotice discountPercent={discountPercent} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {rows.map(({ item, unitPrice, lineTotal, goldPrice }) => {
            const image = item.product.images[0];
            return (
              <Card key={item.id} className="flex gap-4 p-4">
                <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/images/${image.id}`} alt={item.product.name} className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-navy hover:text-primary line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    طلای {toPersianDigits(item.product.karat)} عیار • وزن: {toPersianDigits(formatGram(item.product.weight))}
                    {" "}• هر گرم: {toPersianDigits(formatToman(goldPrice))}
                    {" "}• قیمت واحد: {toPersianDigits(formatToman(unitPrice))}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <CartItemRow itemId={item.id} quantity={item.quantity} name={item.product.name} />
                    <span className="font-bold text-navy">{toPersianDigits(formatToman(lineTotal))}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit p-5 sticky top-28">
          <h2 className="font-bold text-navy mb-4">خلاصه سفارش</h2>
          <div className="space-y-2 text-sm">
            <Row label="مجموع وزن طلا" value={`${toPersianDigits(formatGram(totalGrams))}`} />
            <Row label="مجموع اجرت" value={toPersianDigits(formatToman(totalWage))} />
            <Row label="هر گرم طلای ۱۸ عیار" value={toPersianDigits(formatToman(goldPrices[18]))} />
            <Row label="هر گرم طلای ۲۴ عیار" value={toPersianDigits(formatToman(goldPrices[24]))} />
            {discountPercent > 0 && (
              <>
                <Row label="جمع بدون تخفیف" value={toPersianDigits(formatToman(basePrice))} />
                <div className="flex items-center justify-between text-emerald-700">
                  <span>
                    تخفیف اختصاصی ({toPersianDigits(formatPercent(discountPercent))}٪)
                  </span>
                  <span className="font-medium">
                    − {toPersianDigits(formatToman(discountAmount))}
                  </span>
                </div>
              </>
            )}
            <div className="border-t border-border my-3" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-navy">مبلغ قابل پرداخت</span>
              <span className="font-extrabold text-lg text-navy">{toPersianDigits(formatToman(totalPrice))}</span>
            </div>
          </div>

          {!user.onboarded && (
            <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              برای ثبت سفارش ابتدا پروفایل خود را تکمیل کنید.
            </p>
          )}

          <Button asChild variant="gold" className="w-full mt-5" disabled={!user.onboarded}>
            <Link href={user.onboarded ? "/checkout" : "/onboarding"}>
              ثبت سفارش
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full mt-2">
            <Link href="/products">ادامه خرید</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
