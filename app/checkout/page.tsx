import Link from "next/link";
import { ArrowLeft, PhoneCall } from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireOnboardedUser } from "@/lib/auth";
import { getGoldPricePerGram, computeProductPrice } from "@/lib/gold-price";
import { formatGram, formatToman, toPersianDigits } from "@/lib/format";
import { placeOrderAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "تسویه سفارش" };

export default async function CheckoutPage() {
  const user = await requireOnboardedUser();

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-navy mb-2">سبد خرید شما خالی است</h1>
        <Button asChild variant="gold" className="mt-4"><Link href="/products">مشاهده محصولات</Link></Button>
      </div>
    );
  }

  const goldPrice = await getGoldPricePerGram();
  let totalGrams = 0;
  let totalWage = 0;
  let totalPrice = 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-2">تسویه سفارش</h1>
      <p className="text-sm text-muted-foreground mb-6">
        سفارش شما بدون پرداخت آنلاین ثبت می‌شود. پس از ثبت، کد سفارش صادر می‌شود و
        برای نهایی کردن آن باید با گالری تماس بگیرید.
      </p>

      <Card className="p-5 mb-6">
        <h2 className="font-bold text-navy mb-3">اقلام سفارش</h2>
        <div className="divide-y divide-border">
          {items.map((item) => {
            const unit = computeProductPrice(item.product.weight, item.product.wage, goldPrice);
            const line = unit * item.quantity;
            totalGrams += item.product.weight * item.quantity;
            totalWage += item.product.wage * item.quantity;
            totalPrice += line;
            return (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-navy">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {toPersianDigits(item.quantity)} عدد • وزن {toPersianDigits(formatGram(item.product.weight))}
                  </p>
                </div>
                <span className="font-semibold text-navy">{toPersianDigits(formatToman(line))}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">مجموع وزن طلا</span><span className="font-medium">{toPersianDigits(formatGram(totalGrams))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">مجموع اجرت</span><span className="font-medium">{toPersianDigits(formatToman(totalWage))}</span></div>
          <div className="flex justify-between text-base"><span className="font-bold text-navy">مبلغ کل</span><span className="font-extrabold text-navy">{toPersianDigits(formatToman(totalPrice))}</span></div>
        </div>
      </Card>

      <form action={placeOrderAction} className="space-y-4">
        <Card className="p-5">
          <div className="space-y-2">
            <Label htmlFor="note">توضیحات سفارش (اختیاری)</Label>
            <Textarea id="note" name="note" placeholder="هر نکته‌ای که لازم است گالری بداند..." />
          </div>
        </Card>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <PhoneCall className="size-5 text-primary shrink-0 mt-0.5" />
          <span>پس از ثبت سفارش، صفحه‌ای با کد سفارش و اطلاعات تماس گالری نمایش داده می‌شود. با تماس و اعلام کد، سفارش شما نهایی می‌شود.</span>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full">
          ثبت نهایی سفارش
          <ArrowLeft className="size-4" />
        </Button>
      </form>
    </div>
  );
}
