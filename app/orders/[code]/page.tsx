import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, PhoneCall, MapPin, AtSign, Copy, CheckCircle2 } from "lucide-react";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getShopInfo } from "@/lib/shop";
import {
  formatGram,
  formatPercent,
  formatToman,
  toPersianDigits,
  formatDateJalali,
} from "@/lib/format";
import { OrderCodeBox } from "@/components/order-code-box";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ code: string }> };

const STATUS_LABEL: Record<string, { label: string; variant: "gold" | "success" | "secondary" | "destructive" }> = {
  PENDING: { label: "در انتظار تماس", variant: "gold" },
  PAID: { label: "پرداخت‌شده", variant: "secondary" },
  FINISHED: { label: "تکمیل و تحویل شده", variant: "success" },
  CANCELLED: { label: "لغو شده", variant: "destructive" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return { title: `سفارش ${code}` };
}

export default async function OrderPage({ params }: Props) {
  const { code } = await params;
  const user = await getCurrentUser();

  const order = await db.query.orders.findFirst({
    where: eq(orders.code, code),
    with: { items: true },
  });

  if (!order) notFound();
  if (user?.role !== "ADMIN" && order.userId !== user?.id) notFound();

  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
  const { phone, mobile, address, instagram } = getShopInfo();
  const basePrice = order.items.reduce(
    (sum, item) =>
      sum + (item.weight * item.goldPrice + item.wage) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center mb-8">
        <span className="inline-grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="text-2xl font-bold text-navy">سفارش شما ثبت شد</h1>
        <p className="text-sm text-muted-foreground mt-1">
          برای نهایی کردن سفارش، با گالری تماس بگیرید و کد سفارش را اعلام کنید.
        </p>
      </div>

      <OrderCodeBox code={order.code} />

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">وضعیت سفارش</p>
            <Badge variant={status.variant} className="mt-1">{status.label}</Badge>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">تاریخ ثبت</p>
            <p className="text-sm font-medium mt-1">{toPersianDigits(formatDateJalali(order.createdAt))}</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-navy">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {toPersianDigits(item.quantity)} عدد • طلای{" "}
                  {toPersianDigits(item.karat)} عیار • وزن{" "}
                  {toPersianDigits(formatGram(item.weight))} • هر گرم{" "}
                  {toPersianDigits(formatToman(item.goldPrice))}
                </p>
              </div>
              <span className="font-semibold text-navy">{toPersianDigits(formatToman(item.unitPrice * item.quantity))}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">مجموع وزن طلا</span><span className="font-medium">{toPersianDigits(formatGram(order.totalGrams))}</span></div>
          {order.discountPercent > 0 && (
            <>
              <div className="flex justify-between"><span className="text-muted-foreground">جمع بدون تخفیف</span><span className="font-medium">{toPersianDigits(formatToman(basePrice))}</span></div>
              <div className="flex justify-between text-emerald-700">
                <span>تخفیف اختصاصی ({toPersianDigits(formatPercent(order.discountPercent))}٪)</span>
                <span className="font-medium">− {toPersianDigits(formatToman(basePrice - order.totalPrice))}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base"><span className="font-bold text-navy">مبلغ کل</span><span className="font-extrabold text-navy">{toPersianDigits(formatToman(order.totalPrice))}</span></div>
        </div>
      </Card>

      <Card className="p-6 navy-gradient text-navy-foreground">
        <h2 className="text-lg font-bold text-gold mb-1">اطلاعات تماس گالری کریمی</h2>
        <p className="text-sm text-navy-foreground/80 mb-5">
          لطفاً با شماره زیر تماس بگیرید و کد سفارش خود را اعلام کنید.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactItem icon={<Phone className="size-4 text-gold" />} label="تلفن" value={toPersianDigits(phone)} dir="ltr" />
          {mobile && (
            <ContactItem icon={<PhoneCall className="size-4 text-gold" />} label="موبایل" value={toPersianDigits(mobile)} dir="ltr" />
          )}
          <ContactItem icon={<MapPin className="size-4 text-gold" />} label="آدرس" value={address} />
          {instagram && (
            <ContactItem icon={<AtSign className="size-4 text-gold" />} label="اینستاگرام" value={`@${instagram}`} dir="ltr" />
          )}
        </div>

        <div className="mt-5 rounded-xl border border-navy-foreground/15 bg-navy-foreground/5 p-4 text-sm">
          <p className="flex items-center gap-2 text-gold font-semibold mb-1">
            <Copy className="size-4" /> روند تکمیل سفارش
          </p>
          <ol className="list-decimal pr-5 space-y-1 text-navy-foreground/80">
            <li>با شماره گالری تماس بگیرید.</li>
            <li>کد سفارش بالا را اعلام کنید.</li>
            <li>پس از هماهنگی و تسویه، سفارش آماده و تحویل داده می‌شود.</li>
          </ol>
        </div>
      </Card>

      <div className="flex justify-center gap-3 mt-6">
        <Button asChild variant="outline"><Link href="/products">ادامه خرید</Link></Button>
        <Button asChild variant="ghost"><Link href="/profile?tab=orders">سفارش‌های من</Link></Button>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value, dir }: { icon: React.ReactNode; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-navy-foreground/15 bg-navy-foreground/5 p-3">
      <span className="grid size-9 place-items-center rounded-full bg-navy-foreground/10">{icon}</span>
      <div className="leading-tight">
        <p className="text-xs text-navy-foreground/60">{label}</p>
        <p className="font-semibold" dir={dir}>{value}</p>
      </div>
    </div>
  );
}
